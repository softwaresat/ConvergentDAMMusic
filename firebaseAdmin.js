const admin = require("firebase-admin");

// Load your Firebase Service Account Key
const serviceAccount = require("./convergentdammusic-firebase-adminsdk-fbsvc-a29bfeec41.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://convergentdammusic.firebaseio.com" // Updated to match project ID
});

// Firestore Database Reference
const db = admin.firestore();

// Export the database for use in other scripts
module.exports = { admin, db };
