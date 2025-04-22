const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Initialize Firebase Admin SDK with service account
try {
  // Load service account from the JSON file
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase admin initialized successfully');
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error:', error.stack);
    process.exit(1);
  }
}

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get a list of all MP3 files in the root directory
function getLocalMP3Files() {
  try {
    const files = fs.readdirSync('./');
    const mp3Files = files.filter(file => path.extname(file).toLowerCase() === '.mp3');
    
    console.log('\nFound the following MP3 files in the project directory:');
    mp3Files.forEach((file, i) => {
      console.log(`${i + 1}. ${file}`);
    });
    
    return mp3Files;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

// Set up file server URL base - replace with your actual file server URL
const setUpFileServer = () => {
  console.log('\nTo use local MP3 files, you need to serve them via a local web server.');
  console.log('Please enter a base URL for your file server.');
  console.log('Examples:');
  console.log('- If you\'re using "npx http-server": http://localhost:8080');
  console.log('- If you have a cloud-hosted file server: https://your-domain.com/files');
  
  return new Promise((resolve) => {
    rl.question('\nEnter the base URL for your file server: ', (baseUrl) => {
      // Clean up the URL to ensure it doesn't end with a slash
      const cleanUrl = baseUrl.trim().replace(/\/$/, '');
      resolve(cleanUrl);
    });
  });
};

/**
 * Update a concert document with a local music track info
 */
async function updateConcertWithLocalTrack(concertId, trackFileName, baseUrl) {
  try {
    // Get the concert document
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      console.error(`Concert with ID ${concertId} not found!`);
      return false;
    }
    
    const concertData = concertDoc.data();
    console.log(`Found concert: ${concertData.artistName} at ${concertData.venueName}`);
    
    // Construct the URL for the track
    const trackUrl = `${baseUrl}/${encodeURIComponent(trackFileName)}`;
    
    // Create the music track info object
    const musicTrack = {
      url: trackUrl,
      name: trackFileName,
      artist: concertData.artistName,
      uploadedAt: Date.now()
    };
    
    // Update the Firestore document
    await db.collection('concerts').doc(concertId).update({
      musicTrack: musicTrack
    });
    
    console.log(`Successfully linked ${trackFileName} to concert ${concertId}`);
    console.log(`Track URL: ${trackUrl}`);
    return true;
  } catch (error) {
    console.error('Error updating concert with music track:', error);
    return false;
  }
}

/**
 * List all concerts to choose from
 */
async function listConcerts() {
  try {
    const concerts = await db.collection('concerts').get();
    console.log('\nAvailable concerts:');
    
    concerts.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`${i + 1}. ID: ${doc.id} - ${data.artistName} at ${data.venueName} (${data.date})`);
    });
    
    return concerts.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing concerts:', error);
    return [];
  }
}

/**
 * Main function to run the script
 */
async function main() {
  console.log('🎵 Local MP3 File Connector for StageNextDoor 🎵\n');
  
  try {
    // 1. Find local MP3 files
    const mp3Files = getLocalMP3Files();
    
    if (mp3Files.length === 0) {
      console.log('No MP3 files found in the project directory.');
      rl.close();
      return;
    }
    
    // 2. Get the base URL for the file server
    const baseUrl = await setUpFileServer();
    
    // 3. List all concerts
    const concerts = await listConcerts();
    
    if (concerts.length === 0) {
      console.log('No concerts found in the database.');
      rl.close();
      return;
    }
    
    // 4. Ask user to select a concert
    rl.question('\nEnter the number of the concert to add music to: ', async (concertIndex) => {
      const index = parseInt(concertIndex) - 1;
      
      if (isNaN(index) || index < 0 || index >= concerts.length) {
        console.error('Invalid selection!');
        rl.close();
        return;
      }
      
      const selectedConcert = concerts[index];
      console.log(`\nSelected: ${selectedConcert.artistName} at ${selectedConcert.venueName}`);
      
      // 5. Ask user to select a track
      rl.question('\nEnter the number of the MP3 file to use: ', async (trackIndex) => {
        const tIndex = parseInt(trackIndex) - 1;
        
        if (isNaN(tIndex) || tIndex < 0 || tIndex >= mp3Files.length) {
          console.error('Invalid selection!');
          rl.close();
          return;
        }
        
        const selectedTrack = mp3Files[tIndex];
        console.log(`\nSelected track: ${selectedTrack}`);
        
        // 6. Update the Firestore document
        const success = await updateConcertWithLocalTrack(
          selectedConcert.id,
          selectedTrack,
          baseUrl
        );
        
        if (success) {
          console.log('\n✅ Firestore document updated successfully with local track info!');
          console.log('\nNow start a local file server to serve the MP3 files:');
          console.log('1. Install http-server if you haven\'t already: npm install -g http-server');
          console.log(`2. Run the server in your project directory: http-server -p 8080 --cors`);
          console.log('3. Open your app and navigate to the concert to play the music');
        } else {
          console.log('\n❌ Failed to update Firestore document.');
        }
        
        rl.close();
      });
    });
    
  } catch (error) {
    console.error('Error in main function:', error);
    rl.close();
  }
}

// Run the script
main();
