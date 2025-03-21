const { db } = require("./firebaseAdmin"); // Firestore Admin SDK
const concerts = require("./concerts.json"); // Load concert data

async function uploadConcerts() {
  const batch = db.batch(); // Firestore batch writes

  // 🔥 Step 1: Fetch all existing concerts from Firestore
  const existingConcertsSnapshot = await db.collection("concerts").get();
  const existingConcerts = new Map();
  
  existingConcertsSnapshot.forEach(doc => {
    existingConcerts.set(doc.id, doc.data());
  });

  // 🔄 Step 2: Add or Update concerts
  const concertsInJson = new Set();

  for (const concert of concerts) {
    let docRef;
    if (concert.id && concert.id.trim() !== "") {
      docRef = db.collection("concerts").doc(concert.id.trim());
    } else {
      docRef = db.collection("concerts").doc(); // Generate a new Firestore ID
      concert.id = docRef.id; // Assign the new ID
      console.log(`🆕 New concert added with ID: ${concert.id}`);
    }

    concertsInJson.add(concert.id); // Track which concerts should exist

    if (existingConcerts.has(concert.id)) {
      const existingData = existingConcerts.get(concert.id);
      const hasChanges = Object.keys(concert).some(key => concert[key] !== existingData[key]);

      if (!hasChanges) {
        console.log(`🔍 No changes detected for ${concert.id}, skipping update.`);
        continue;
      }
    }

    batch.set(docRef, concert, { merge: true });
  }

  // ❌ Step 3: Delete concerts that are no longer in `concerts.json`
  for (const [concertId] of existingConcerts) {
    if (!concertsInJson.has(concertId)) {
      console.log(`🗑️ Deleting concert with ID: ${concertId}`);
      batch.delete(db.collection("concerts").doc(concertId));
    }
  }

  await batch.commit();
  console.log("✅ Concerts added, updated, and removed successfully!");
}

uploadConcerts().catch(console.error);
