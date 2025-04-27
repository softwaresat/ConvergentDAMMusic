const { db } = require("./firebaseAdmin"); // Firestore Admin SDK
const fs = require('fs');
const path = require('path');
const concerts = require("./concerts.json"); // Load concert data

async function uploadConcerts() {
  console.log(`Starting concert upload process for ${concerts.length} concerts...`);
  const batch = db.batch(); // Firestore batch writes

  try {
    // Step 1: Fetch all existing concerts from Firestore
    console.log("Fetching existing concerts from Firestore...");
    const existingConcertsSnapshot = await db.collection("concerts").get();
    const existingConcerts = new Map();
    
    existingConcertsSnapshot.forEach(doc => {
      existingConcerts.set(doc.id, doc.data());
      console.log(`Found existing concert: ${doc.id} (${doc.data().artistName})`);
    });
    
    console.log(`Found ${existingConcerts.size} existing concerts in the database.`);

    // Step 2: Prepare for tracking artist-specific data
    const hasLocalMusic = ['CorMae', 'Evania', 'Fifi Knifefight', 'Social Dissonance']; // Artists with local music files
    
    // Step 3: Add or Update concerts
    const concertsInJson = new Set();
    const updatedConcerts = [];

    for (const concert of concerts) {
      // Generate a deterministic ID based on artist name and venue to avoid duplicates
      // This ensures we get the same ID each time for the same concert
      let concertId = concert.id;
      
      if (!concertId || concertId.trim() === "") {
        // Create an ID based on artist and venue (simple hashing for consistency)
        const idBase = `${concert.artistName}-${concert.venueName}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        concertId = idBase;
      }
      
      const docRef = db.collection("concerts").doc(concertId);
      concertsInJson.add(concertId);
      
      // Check if this artist has local music files
      const artistHasLocalMusic = hasLocalMusic.includes(concert.artistName);
      if (artistHasLocalMusic) {
        console.log(`Artist ${concert.artistName} has local music files available.`);
      }
      
      // Add artistHasLocalMusic field to concert data
      const concertData = { 
        ...concert, 
        id: concertId,
        hasLocalMusic: artistHasLocalMusic 
      };
      
      // Check if the concert exists already
      if (existingConcerts.has(concertId)) {
        console.log(`Updating existing concert: ${concertId} (${concert.artistName})`);
      } else {
        console.log(`Adding new concert: ${concertId} (${concert.artistName})`);
      }
      
      // Add to batch operation
      batch.set(docRef, concertData, { merge: true });
      
      // Keep track of updated concerts with their IDs
      updatedConcerts.push(concertData);
    }

    // Step 4: Delete concerts that are no longer in `concerts.json`
    let deletedCount = 0;
    for (const [concertId] of existingConcerts) {
      if (!concertsInJson.has(concertId)) {
        console.log(`Deleting concert with ID: ${concertId}`);
        batch.delete(db.collection("concerts").doc(concertId));
        deletedCount++;
      }
    }

    // Step 5: Commit the batch operation
    console.log("Committing batch operation to Firestore...");
    await batch.commit();
    
    // Step 6: Optionally update the local JSON with IDs
    fs.writeFileSync(
      path.join(__dirname, 'concerts_with_ids.json'), 
      JSON.stringify(updatedConcerts, null, 2)
    );
    console.log("Updated concerts JSON saved as concerts_with_ids.json");
    
    console.log(`
    Operation completed successfully:
    - Added/Updated: ${concertsInJson.size} concerts
    - Deleted: ${deletedCount} concerts
    - Total in database: ${concertsInJson.size}
    `);
    
  } catch (error) {
    console.error("Error uploading concerts:", error);
    throw error; // Re-throw to ensure the process exits with error if needed
  }
}

console.log("Starting concert upload process...");
uploadConcerts()
  .then(() => {
    console.log("Concert upload process completed successfully!");
  })
  .catch(error => {
    console.error("Failed to upload concerts:", error);
    process.exit(1); // Exit with error code
  });
