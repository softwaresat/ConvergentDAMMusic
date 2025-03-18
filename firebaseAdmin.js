const admin = require('firebase-admin');
const serviceAccount = require('convergentdammusic-firebase-adminsdk-fbsvc-a29bfeec41.json'); // Replace with the path to your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://convergentdammusic.firebaseio.com' // Replace with your database URL
});

const db = admin.firestore();

module.exports = { db };
