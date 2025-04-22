// firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  connectFirestoreEmulator, 
  enableNetwork, 
  disableNetwork,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  CACHE_SIZE_UNLIMITED,
  memoryLocalCache,
  setLogLevel,
  Firestore
} from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, connectAuthEmulator, signOut, Auth } from "firebase/auth";
import { getStorage, ref as storageRef } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// Enable more verbose logging in development
if (__DEV__) {
  setLogLevel('debug');
}

// DIRECT FIREBASE CONFIG - Use this as fallback if environment variables aren't working
const DIRECT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCnQqGXIXYAIvD1DMURCYZXoZxIhh4By_k",
  authDomain: "convergentdam.firebaseapp.com",
  projectId: "convergentdam",
  storageBucket: "convergentdam.appspot.com",
  messagingSenderId: "932563838224",
  appId: "1:932563838224:web:c88c6c8eacb3f06a123456",
};

// Firebase config pulled from .env (Expo reads EXPO_PUBLIC_...)
const envFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "convergentdam",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Decide which config to use - prefer environment variables, but fall back to direct config
const firebaseConfig = (envFirebaseConfig.apiKey && envFirebaseConfig.projectId)
  ? envFirebaseConfig 
  : DIRECT_FIREBASE_CONFIG;

// Debug logs for Firebase configuration
console.log("[Firebase Config]", {
  apiKey: firebaseConfig.apiKey ? "Set" : "Missing",
  authDomain: firebaseConfig.authDomain ? "Set" : "Missing",
  projectId: firebaseConfig.projectId || "Missing",
  storageBucket: firebaseConfig.storageBucket ? "Set" : "Missing",
  messagingSenderId: firebaseConfig.messagingSenderId ? "Set" : "Missing",
  appId: firebaseConfig.appId ? "Set" : "Missing",
});

// Initialize Firebase with improved error handling
let app;
let db: Firestore;
let auth: Auth;
let firestoreInitialized = false;
let networkAvailable = true;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function initializeFirebaseApp() {
  try {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase] App initialized successfully");
    return app;
  } catch (error) {
    console.error(`[Firebase] Initialization error (attempt ${initializationAttempts + 1}/${MAX_INIT_ATTEMPTS}):`, error);
    
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      initializationAttempts++;
      console.log(`[Firebase] Retrying initialization with direct config...`);
      return initializeApp(DIRECT_FIREBASE_CONFIG);
    }
    
    console.error("[Firebase] Failed to initialize after multiple attempts");
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

// Function to reinitialize Firebase after it's been terminated
function initializeFirebase() {
  try {
    // If app is not already initialized, initialize it
    if (!app) {
      app = initializeFirebaseApp();
    }
    
    // Determine which cache implementation to use based on platform
    const isWeb = Platform.OS === 'web';
    const isExpo = typeof global.expo !== 'undefined';
    
    // For Expo Go environment, use simpler memory cache to avoid persistence issues
    const cacheSettings = isExpo ? 
      // Simple memory cache for Expo Go (more reliable)
      { localCache: memoryLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        })
      } : 
      // Persistent cache for production builds
      { localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      };
    
    // Initialize Firestore with appropriate cache settings
    db = initializeFirestore(app, cacheSettings);
    firestoreInitialized = true;
    console.log("[Firebase] Firestore initialized with " + (isExpo ? "memory" : "persistent") + " cache");
    
    // Initialize Firebase Auth with AsyncStorage for persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log("[Firebase] Auth initialized with persistence");
    
    // Try to connect to emulator if running in development and specified
    const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    if (useEmulator && process.env.EXPO_PUBLIC_EMULATOR_IP) {
      try {
        console.log(`[Firebase] Attempting to connect to Firestore emulator at ${process.env.EXPO_PUBLIC_EMULATOR_IP}:8080`);
        connectFirestoreEmulator(db, process.env.EXPO_PUBLIC_EMULATOR_IP, 8080);
        connectAuthEmulator(auth, `http://${process.env.EXPO_PUBLIC_EMULATOR_IP}:9099`);
        console.log("[Firebase] Connected to Firebase emulators");
      } catch (error) {
        console.error("[Firebase] Failed to connect to emulator:", error);
      }
    }

    return { app, db, auth };
  } catch (error) {
    console.error("[Firebase] Reinitialization error:", error);
    throw error;
  }
}

// Initialize Firebase app
try {
  // Initial setup using the function we just defined
  const { app: initializedApp, db: initializedDb, auth: initializedAuth } = initializeFirebase();
  app = initializedApp;
  db = initializedDb;
  auth = initializedAuth;
  
  // Initialize Firebase Storage
  const storage = getStorage(app);
  console.log("[Firebase] Storage initialized");

  // Set up offline persistence immediately to enable offline support
  disableNetwork(db).then(() => {
    console.log('[Firebase] Network disabled temporarily to ensure offline setup');
    
    // Re-enable after a short delay to ensure offline persistence is properly set up
    setTimeout(() => {
      enableNetwork(db).then(() => {
        console.log('[Firebase] Network re-enabled after offline setup');
        networkAvailable = true;
      }).catch(err => {
        console.warn('[Firebase] Failed to re-enable network:', err);
        networkAvailable = false;
      });
    }, 1000);
  }).catch(err => {
    console.warn('[Firebase] Error setting up offline persistence:', err);
  });
  
} catch (error) {
  console.error("[Firebase] Critical initialization error:", error);
  // Create fallback instances to prevent app crashes
  if (!app) app = {} as any;
  if (!db) db = {} as any;
  if (!auth) auth = {} as any;
}

// Monitor network status
const checkNetworkAndReconnect = async () => {
  if (!firestoreInitialized) return false;
  
  try {
    await enableNetwork(db);
    networkAvailable = true;
    console.log("[Firebase] Network connection restored");
    return true;
  } catch (error) {
    networkAvailable = false;
    console.log("[Firebase] Network still unavailable:", error.message);
    return false;
  }
};

// Helper function for safe Firestore operations
const safeFirestoreOperation = async (operation) => {
  if (!firestoreInitialized) {
    console.warn("[Firebase] Attempting operation when Firestore is not initialized");
    return null;
  }

  try {
    // Try the operation
    return await operation();
  } catch (error) {
    console.log("[Firebase] Firestore operation failed:", error);
    
    // If we got a network error, try to reconnect
    if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
      console.log("[Firebase] Network error detected, attempting to reconnect...");
      await checkNetworkAndReconnect();
    }
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

// Functions to manually control network connectivity
const enableFirestoreNetwork = async () => {
  if (!firestoreInitialized) return false;
  
  try {
    await enableNetwork(db);
    networkAvailable = true;
    console.log("[Firebase] Network enabled");
    return true;
  } catch (error) {
    console.error("[Firebase] Error enabling network:", error);
    return false;
  }
};

const disableFirestoreNetwork = async () => {
  if (!firestoreInitialized) return false;
  
  try {
    await disableNetwork(db);
    networkAvailable = false;
    console.log("[Firebase] Network disabled");
    return true;
  } catch (error) {
    console.error("[Firebase] Error disabling network:", error);
    return false;
  }
};

// Improved logout function that handles network issues
const cleanSignOut = async () => {
  try {
    console.log("[Firebase] Starting clean sign out process...");
    
    if (!firestoreInitialized) {
      console.log("[Firebase] Firestore not initialized, skipping Firestore cleanup");
      return true;
    }
    
    try {
      // Try to disable network first, but don't block on it
      await Promise.race([
        disableFirestoreNetwork(),
        new Promise(resolve => setTimeout(resolve, 1000)) // 1 second timeout
      ]);
      
      // Sign out from Firebase Auth if available
      if (auth && auth.currentUser) {
        await signOut(auth).catch(err => 
          console.log("[Firebase] Auth sign out error:", err)
        );
      }
      
      // Try to terminate Firestore if initialized
      if (firestoreInitialized) {
        await Promise.race([
          terminate(db),
          new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
        ]).catch(err => 
          console.log("[Firebase] Firestore terminate error:", err)
        );
      }
      
      console.log("[Firebase] Sign out completed successfully");
      
      // Reinitialize Firestore for future use
      if (firestoreInitialized) {
        const isExpo = typeof global.expo !== 'undefined';
        const cacheSettings = isExpo ? 
          { localCache: memoryLocalCache() } : 
          { localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            })
          };
        
        db = initializeFirestore(app, cacheSettings);
      }
      
      return true;
    } catch (error) {
      console.error("[Firebase] Clean sign out had issues:", error);
      // Attempt to continue regardless of errors
      return true;
    }
  } catch (error) {
    console.error("[Firebase] Clean sign out error:", error);
    return false;
  }
};

// Is Firebase fully operational?
const isFirebaseOperational = () => {
  return firestoreInitialized && app && db && auth;
};

// Is Network available for Firestore?
const isNetworkAvailable = () => {
  return networkAvailable;
};

// Export Firestore + Auth + helper functions
export { 
  db, 
  auth, 
  app,
  collection, 
  enableFirestoreNetwork, 
  disableFirestoreNetwork,
  safeFirestoreOperation,
  cleanSignOut,
  isFirebaseOperational,
  isNetworkAvailable,
  checkNetworkAndReconnect,
  initializeFirebase,
  getStorage,
  storageRef
};
