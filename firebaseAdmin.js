const admin = require("firebase-admin");

// Load your Firebase Service Account Key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://convergentdam.firebaseio.com" // Replace with your actual project ID
});

// Firestore Database Reference
const db = admin.firestore();

// Export the database for use in other scripts
module.exports = { admin, db };
