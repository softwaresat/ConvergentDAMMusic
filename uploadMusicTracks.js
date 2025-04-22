const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Initialize Firebase Admin SDK with service account
try {
  // Load service account from the JSON file
  const serviceAccount = require('./serviceAccountKey.json');
  
  // Get the project ID from the service account
  const projectId = serviceAccount.project_id;
  
  // Correctly format the default bucket name (project-id.appspot.com)
  const storageBucket = `${projectId}.appspot.com`;
  
  console.log(`Initializing Firebase with bucket: ${storageBucket}`);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucket
  });
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error:', error.stack);
    process.exit(1);
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Upload a local MP3 file to Firebase Storage and update Firestore
 */
async function uploadMusicTrack(localFilePath, concertId) {
  try {
    // 1. Get the concert document
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      console.error(`Concert with ID ${concertId} not found!`);
      return false;
    }
    
    const concertData = concertDoc.data();
    console.log(`Found concert: ${concertData.artistName} at ${concertData.venueName}`);

    // 2. Upload the file to Firebase Storage
    const fileName = path.basename(localFilePath);
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Make sure it's an MP3
    if (fileExtension !== 'mp3') {
      console.error('Only MP3 files are supported');
      return false;
    }
    
    // Create a unique file path in storage
    const storageFilePath = `music/${concertId}_${timestamp}.${fileExtension}`;
    
    console.log(`Uploading ${fileName} to Firebase Storage...`);
    
    // Upload the file
    const fileBuffer = fs.readFileSync(localFilePath);
    const file = bucket.file(storageFilePath);
    
    console.log(`Uploading to bucket: ${bucket.name}`);
    console.log(`Target path: ${storageFilePath}`);
    
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'audio/mpeg',
      }
    });
    
    // 3. Make the file publicly accessible
    await file.makePublic();
    
    // 4. Get the public URL of the file
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFilePath}`;
    console.log(`File uploaded. Public URL: ${publicUrl}`);
    
    // 5. Update the Firestore document
    const musicTrackInfo = {
      url: publicUrl,
      name: fileName,
      artist: concertData.artistName,
      uploadedAt: timestamp
    };
    
    await db.collection('concerts').doc(concertId).update({
      musicTrack: musicTrackInfo
    });
    
    console.log(`Successfully updated Firestore document for concert ${concertId}`);
    return true;
    
  } catch (error) {
    console.error('Error uploading music track:', error);
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
  console.log('🎵 Music Track Upload Utility for StageNextDoor 🎵\n');
  
  try {
    // 1. List all concerts
    const concerts = await listConcerts();
    
    if (concerts.length === 0) {
      console.log('No concerts found in the database.');
      rl.close();
      return;
    }
    
    // 2. Ask user to select a concert
    rl.question('\nEnter the number of the concert to add music to: ', async (concertIndex) => {
      const index = parseInt(concertIndex) - 1;
      
      if (isNaN(index) || index < 0 || index >= concerts.length) {
        console.error('Invalid selection!');
        rl.close();
        return;
      }
      
      const selectedConcert = concerts[index];
      console.log(`\nSelected: ${selectedConcert.artistName} at ${selectedConcert.venueName}`);
      
      // 3. Ask for the local file path
      rl.question('\nEnter the full path to your MP3 file: ', async (filePath) => {
        const normalizedPath = filePath.trim();
        
        if (!fs.existsSync(normalizedPath)) {
          console.error('File does not exist!');
          rl.close();
          return;
        }
        
        // 4. Upload the file and update Firestore
        const success = await uploadMusicTrack(normalizedPath, selectedConcert.id);
        
        if (success) {
          console.log('\n✅ Music track uploaded and Firestore document updated successfully!');
        } else {
          console.log('\n❌ Failed to upload music track.');
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
