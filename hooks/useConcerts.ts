import { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, getDoc, where, orderBy, limit, DocumentData } from 'firebase/firestore';
import { 
  db, 
  safeFirestoreOperation, 
  isFirebaseOperational, 
  isNetworkAvailable,
  enableFirestoreNetwork, 
  disableFirestoreNetwork, 
  checkNetworkAndReconnect
} from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key for storing concerts locally
const CONCERTS_CACHE_KEY = 'cached_concerts';
const LAST_FETCH_TIME_KEY = 'last_concerts_fetch_time';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useConcerts() {
  const [concerts, setConcerts] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Load cached concerts from AsyncStorage
  const loadCachedConcerts = async () => {
    try {
      const cachedConcerts = await AsyncStorage.getItem(CONCERTS_CACHE_KEY);
      if (cachedConcerts) {
        console.log("[Concerts] Loaded concerts from cache");
        return JSON.parse(cachedConcerts);
      }
    } catch (err) {
      console.log("[Concerts] Error loading cached concerts:", err);
    }
    return null;
  };

  // Save concerts to cache
  const cacheConcerts = async (data: DocumentData[]) => {
    if (!data || data.length === 0) {
      console.log("[Concerts] No data to cache");
      return;
    }
    
    try {
      await AsyncStorage.setItem(CONCERTS_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(LAST_FETCH_TIME_KEY, Date.now().toString());
      console.log("[Concerts] Saved concerts to cache");
    } catch (err) {
      console.log("[Concerts] Error caching concerts:", err);
    }
  };

  // Check if cache is expired
  const isCacheExpired = async () => {
    try {
      const lastFetchTime = await AsyncStorage.getItem(LAST_FETCH_TIME_KEY);
      if (!lastFetchTime) return true;
      
      const timeDiff = Date.now() - parseInt(lastFetchTime);
      return timeDiff > CACHE_EXPIRY;
    } catch (err) {
      console.log("[Concerts] Error checking cache expiry:", err);
      return true;
    }
  };

  // Function to fetch concerts from Firestore with improved error handling
  const fetchConcertsFromFirestore = async (retryCount = 0, forceRefresh = false) => {
    // Check if Firebase is operational first
    if (!isFirebaseOperational()) {
      console.log("[Concerts] Firebase is not operational, using cached data");
      const cachedData = await loadCachedConcerts();
      if (cachedData) {
        setConcerts(cachedData);
        setIsOffline(true);
      }
      setLoading(false);
      setError("Firebase not initialized properly - using cached data");
      return null;
    }

    try {
      // Check connectivity and attempt reconnection
      if (!isNetworkAvailable() || forceRefresh) {
        await checkNetworkAndReconnect();
      }
      
      // Load data using the safeFirestoreOperation helper
      console.log("[Concerts] Attempting to fetch concerts from Firestore...");
      const concertData = await safeFirestoreOperation(async () => {
        const concertsCollection = collection(db, 'concerts');
        
        // Create a query to sort concerts by date
        const concertsQuery = query(
          concertsCollection,
          orderBy('date', 'desc'),
          limit(50) // Limit to 50 concerts for performance
        );
        
        const querySnapshot = await getDocs(concertsQuery);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      });
      
      if (concertData && concertData.length > 0) {
        console.log(`[Concerts] Successfully fetched ${concertData.length} concerts from Firestore`);
        
        // Cache the concerts for offline use
        await cacheConcerts(concertData);
        
        setConcerts(concertData);
        setLoading(false);
        setError(null);
        setIsOffline(false);
        setLastRefreshTime(new Date());
        
        return concertData;
      } else {
        throw new Error("No concerts returned from Firestore");
      }
    } catch (err) {
      console.log(`[Concerts] Error fetching concerts (attempt ${retryCount + 1}):`, err);
      
      // If this is the first failure, try once more
      if (retryCount === 0) {
        console.log("[Concerts] Retrying fetch after brief delay...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return fetchConcertsFromFirestore(retryCount + 1);
      }
      
      // If we've already retried, fall back to cached data
      const cachedData = await loadCachedConcerts();
      if (cachedData && cachedData.length > 0) {
        console.log("[Concerts] Using cached concerts due to Firestore error");
        setConcerts(cachedData);
        setError("Using cached data - couldn't connect to database");
        setIsOffline(true);
      } else {
        setError("Couldn't connect to database and no cached data available");
        setIsOffline(true);
      }
      
      setLoading(false);
      return null;
    }
  };

  // Get a single concert by ID with improved error handling
  const getConcert = async (id: string) => {
    try {
      // First check in the loaded state
      const loadedConcert = concerts.find(c => c.id === id);
      if (loadedConcert) {
        return loadedConcert;
      }

      // Add timeout protection to Firestore fetch
      let concertData = null;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore timeout")), 5000)
      );
      
      try {
        // Try to fetch from Firestore with timeout
        if (isFirebaseOperational() && isNetworkAvailable()) {
          const fetchPromise = safeFirestoreOperation(async () => {
            const concertDoc = await getDoc(doc(db, 'concerts', id));
            if (concertDoc.exists()) {
              return { id: concertDoc.id, ...concertDoc.data() };
            }
            return null;
          });
          
          concertData = await Promise.race([fetchPromise, timeoutPromise]);
        }
      } catch (firestoreErr) {
        console.log(`[Concerts] Firestore error fetching concert ${id}:`, firestoreErr);
        // Fall through to cache check
      }
      
      if (concertData) {
        return concertData;
      }
      
      // Check cache as fallback or primary source if offline
      const cachedConcerts = await loadCachedConcerts();
      const cachedConcert = cachedConcerts?.find((c: any) => c.id === id);
      if (cachedConcert) {
        return cachedConcert;
      }
      
      throw new Error(`Concert with ID ${id} not found`);
    } catch (err) {
      console.log(`[Concerts] Error fetching concert ${id}:`, err);
      
      // Last attempt: try to find the concert in cache
      try {
        const cachedConcerts = await loadCachedConcerts();
        const cachedConcert = cachedConcerts?.find((c: any) => c.id === id);
        if (cachedConcert) {
          return cachedConcert;
        }
      } catch (cacheErr) {
        console.log("[Concerts] Error accessing cache:", cacheErr);
      }
      
      throw err;
    }
  };

  // Manual refresh function that users can call
  const refreshConcerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await checkNetworkAndReconnect();
      await fetchConcertsFromFirestore(0, true); // Force a refresh
    } catch (error) {
      console.log("[Concerts] Refresh error:", error);
      setLoading(false);
      setError("Failed to refresh concerts");
    }
  };

  // Test connectivity by forcing offline mode
  const testOfflineMode = async () => {
    try {
      await disableFirestoreNetwork();
      setIsOffline(true);
      console.log("[Concerts] Firestore network disabled for testing");
    } catch (err) {
      console.log("[Concerts] Error setting offline mode:", err);
    }
  };

  // Restore online mode
  const restoreOnlineMode = async () => {
    try {
      await enableFirestoreNetwork();
      setIsOffline(false);
      console.log("[Concerts] Firestore network enabled");
      refreshConcerts();
    } catch (err) {
      console.log("[Concerts] Error restoring online mode:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    async function loadConcerts() {
      try {
        // Always load from cache first for immediate display
        const cachedData = await loadCachedConcerts();
        if (cachedData && isMounted && cachedData.length > 0) {
          setConcerts(cachedData);
          // Don't set loading to false yet if we need to fetch fresh data
        }
        
        // Check if we should use the cache or fetch fresh data
        const shouldFetchFromNetwork = await isCacheExpired();
        
        // Fetch from network if cache is expired or empty
        if (shouldFetchFromNetwork || !cachedData || cachedData.length === 0) {
          console.log("[Concerts] Fetching fresh concert data from network");
          await fetchConcertsFromFirestore();
        } else {
          // If we're using cached data only, mark loading as complete
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.log("[Concerts] Error in loadConcerts:", err);
        if (isMounted) {
          setLoading(false);
          setError("Error loading concerts");
        }
      }
    }

    loadConcerts();
    
    // Set a timeout to ensure loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        if (!concerts.length) {
          setError("Timed out while loading concerts");
        }
      }
    }, 8000); // 8 seconds timeout
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  return {
    concerts,
    loading,
    error,
    isOffline,
    lastRefreshTime,
    getConcert,
    refreshConcerts,
    testOfflineMode,
    restoreOnlineMode
  };
}
