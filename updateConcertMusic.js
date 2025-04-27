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

// List of MP3 files in the project directory
const availableTracks = [
  {
    name: 'Evania.mp3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    name: 'CorMae.mp3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    name: 'fifi knifefight.mp3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    name: 'Social Dissonance.mp3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    name: 'Demo Track 5',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    name: 'Demo Track 6',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    name: 'Demo Track 7',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    name: 'Demo Track 8',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  }
];

/**
 * Update a concert document with music track info
 */
async function updateConcertWithMusicTrack(concertId, trackInfo) {
  try {
    // Get the concert document
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      console.error(`Concert with ID ${concertId} not found!`);
      return false;
    }
    
    const concertData = concertDoc.data();
    console.log(`Found concert: ${concertData.artistName} at ${concertData.venueName}`);
    
    // Create the music track info object
    const musicTrack = {
      url: trackInfo.url,
      name: trackInfo.name,
      artist: concertData.artistName,
      uploadedAt: Date.now()
    };
    
    // Update the Firestore document
    await db.collection('concerts').doc(concertId).update({
      musicTrack: musicTrack
    });
    
    console.log(`Successfully updated Firestore document for concert ${concertId}`);
    return true;
  } catch (error) {
    console.error('Error updating concert with music track:', error);
    return false;
  }
}

/**
 * Update a concert's artist name
 */
async function updateConcertArtistName(concertId, newName) {
  try {
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      console.error(`Concert with ID ${concertId} not found!`);
      return false;
    }
    
    const concertData = concertDoc.data();
    console.log(`Updating concert: ${concertData.artistName} → ${newName}`);
    
    // Check if this is a local music artist name
    const localMusicArtists = ['CorMae', 'Evania', 'Fifi Knifefight', 'Social Dissonance'];
    const isLocalMusicArtist = localMusicArtists.some(
      name => name.toLowerCase() === newName.toLowerCase()
    );
    
    // Update the Firestore document
    await db.collection('concerts').doc(concertId).update({
      artistName: newName,
      hasLocalMusic: isLocalMusicArtist
    });
    
    console.log(`Successfully updated artist name for concert ${concertId}`);
    return true;
  } catch (error) {
    console.error('Error updating concert artist name:', error);
    return false;
  }
}

/**
 * Force update of all cached data
 */
async function clearOldCacheTimestamps() {
  try {
    // Get all concerts
    const concerts = await db.collection('concerts').get();
    
    // Create a batch operation
    const batch = db.batch();
    
    // For each concert, update the lastUpdated field
    concerts.docs.forEach(doc => {
      const ref = db.collection('concerts').doc(doc.id);
      batch.update(ref, { 
        lastUpdated: Date.now() 
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Successfully updated timestamps on ${concerts.size} concerts to invalidate caches.`);
    return true;
  } catch (error) {
    console.error('Error clearing cache timestamps:', error);
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
 * Main menu
 */
async function showMainMenu() {
  console.log('\n🎵 StageNextDoor Admin Utility 🎵');
  console.log('1. Add music track to concert');
  console.log('2. Update artist name');
  console.log('3. Force refresh all concert cache timestamps');
  console.log('4. Exit');
  
  rl.question('\nSelect an option (1-4): ', async (option) => {
    switch (option) {
      case '1':
        await handleAddMusicTrack();
        break;
      case '2':
        await handleUpdateArtistName();
        break;
      case '3':
        await handleForceCacheRefresh();
        break;
      case '4':
        console.log('Exiting...');
        rl.close();
        break;
      default:
        console.log('Invalid option, please try again.');
        showMainMenu();
        break;
    }
  });
}

/**
 * Handle adding music track to a concert
 */
async function handleAddMusicTrack() {
  // List all concerts
  const concerts = await listConcerts();
  
  if (concerts.length === 0) {
    console.log('No concerts found in the database.');
    showMainMenu();
    return;
  }
  
  // Ask user to select a concert
  rl.question('\nEnter the number of the concert to add music to: ', async (concertIndex) => {
    const index = parseInt(concertIndex) - 1;
    
    if (isNaN(index) || index < 0 || index >= concerts.length) {
      console.error('Invalid selection!');
      showMainMenu();
      return;
    }
    
    const selectedConcert = concerts[index];
    console.log(`\nSelected: ${selectedConcert.artistName} at ${selectedConcert.venueName}`);
    
    // Show available tracks
    console.log('\nAvailable music tracks:');
    availableTracks.forEach((track, i) => {
      console.log(`${i + 1}. ${track.name}`);
    });
    
    // Ask user to select a track
    rl.question('\nEnter the number of the track to use: ', async (trackIndex) => {
      const tIndex = parseInt(trackIndex) - 1;
      
      if (isNaN(tIndex) || tIndex < 0 || tIndex >= availableTracks.length) {
        console.error('Invalid selection!');
        showMainMenu();
        return;
      }
      
      const selectedTrack = availableTracks[tIndex];
      console.log(`\nSelected track: ${selectedTrack.name}`);
      
      // Update the Firestore document
      const success = await updateConcertWithMusicTrack(selectedConcert.id, selectedTrack);
      
      if (success) {
        console.log('\n✅ Firestore document updated successfully with music track info!');
      } else {
        console.log('\n❌ Failed to update Firestore document.');
      }
      
      showMainMenu();
    });
  });
}

/**
 * Handle updating artist name
 */
async function handleUpdateArtistName() {
  // List all concerts
  const concerts = await listConcerts();
  
  if (concerts.length === 0) {
    console.log('No concerts found in the database.');
    showMainMenu();
    return;
  }
  
  // Ask user to select a concert
  rl.question('\nEnter the number of the concert to update: ', async (concertIndex) => {
    const index = parseInt(concertIndex) - 1;
    
    if (isNaN(index) || index < 0 || index >= concerts.length) {
      console.error('Invalid selection!');
      showMainMenu();
      return;
    }
    
    const selectedConcert = concerts[index];
    console.log(`\nSelected: ${selectedConcert.artistName} at ${selectedConcert.venueName}`);
    
    // Ask for new artist name
    rl.question(`\nEnter new artist name (current: ${selectedConcert.artistName}): `, async (newName) => {
      if (!newName.trim()) {
        console.error('Name cannot be empty!');
        showMainMenu();
        return;
      }
      
      const success = await updateConcertArtistName(selectedConcert.id, newName.trim());
      
      if (success) {
        console.log('\n✅ Artist name updated successfully!');
        // Also update the cache timestamps
        await clearOldCacheTimestamps();
      } else {
        console.log('\n❌ Failed to update artist name.');
      }
      
      showMainMenu();
    });
  });
}

/**
 * Handle force cache refresh
 */
async function handleForceCacheRefresh() {
  console.log('\nForcing update of all concert timestamps to invalidate caches...');
  
  const success = await clearOldCacheTimestamps();
  
  if (success) {
    console.log('\n✅ Cache timestamps updated successfully! App should refresh data on next load.');
  } else {
    console.log('\n❌ Failed to update cache timestamps.');
  }
  
  showMainMenu();
}

/**
 * Main function to run the script
 */
async function main() {
  console.log('🎵 StageNextDoor Admin Utility 🎵');
  await showMainMenu();
}

// Run the script
main();
