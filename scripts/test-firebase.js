// Test Firebase connection
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('Testing Firebase connection with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

async function testFirebaseConnection() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
    
    // Initialize Firestore
    const db = getFirestore(app);
    console.log('Firestore initialized');
    
    // Try to get documents from 'concerts' collection
    console.log('Attempting to fetch concerts collection...');
    const concertsCollection = collection(db, 'concerts');
    const concertsSnapshot = await getDocs(concertsCollection);
    
    console.log(`Successfully connected! Found ${concertsSnapshot.size} documents in 'concerts' collection.`);
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

testFirebaseConnection()
  .then(isConnected => {
    if (isConnected) {
      console.log('Firebase connection test PASSED');
      process.exit(0);
    } else {
      console.log('Firebase connection test FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
