// app/genres.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation, useLocalSearchParams, useFocusEffect } from 'expo-router';
import globalStyles from '../../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useSpotify } from '../../hooks/useSpotify';
import { FontAwesome } from '@expo/vector-icons';

// Export the genre list so it can be used in other files like useSpotify.tsx
export const genres = [
  'Pop', 'Jazz', 'Rock', 'Hip-Hop', 'Classical',
  'EDM', 'Country', 'R&B', 'Folk', 'Blues',
  'K-pop', 'Metal', 'Indie', 'Reggae', 'Disco'
];

const GenreScreen = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const fastLoad = params.fastLoad === 'true';
  
  const db = getFirestore();
  const auth = getAuth();
  const spotify = useSpotify();
  
  const [isFromSignup, setIsFromSignup] = useState(false);

  useEffect(() => {
    const checkIfFromSignup = async () => {
      try {
        const fromSignup = await AsyncStorage.getItem('fromSignup');
        console.log("[GenreScreen] fromSignup value:", fromSignup);
        
        // Explicitly set to false if not true
        if (fromSignup === 'true') {
          console.log("[GenreScreen] User is coming from signup");
          setIsFromSignup(true);
        } else {
          console.log("[GenreScreen] User is NOT coming from signup");
          setIsFromSignup(false);
        }
      } catch (error) {
        console.log('Error checking if from signup:', error);
        setIsFromSignup(false); // Default to false on error
      } finally {
        if (fastLoad) {
          setInitialLoading(false);
        }
      }
    };

    checkIfFromSignup();
  }, [fastLoad]);

  useEffect(() => {
    if (isFromSignup) {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (e.data.action.type === 'GO_BACK') {
          e.preventDefault();
        }
      });

      return unsubscribe;
    }
  }, [isFromSignup, navigation]);

  // Wrap loadUserGenres in useCallback
  const loadUserGenres = useCallback(async () => {
    try {
      if (fastLoad && isFromSignup) {
        setInitialLoading(false);
        return;
      }
      
      setInitialLoading(true); // Show loading indicator while fetching
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        
        if (parsedUserData.favoriteGenres && parsedUserData.favoriteGenres.length > 0) {
          setSelectedGenres(parsedUserData.favoriteGenres);
          setInitialLoading(false);
          return;
        }
      }
      
      // Only fetch from Firestore if not coming from signup and no data in AsyncStorage
      if (!isFromSignup && auth.currentUser) {
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore query timeout')), 2000)
        );
        
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const firestorePromise = getDoc(userDocRef);
          
          const result = await Promise.race([firestorePromise, timeout]);
          
          if (result && result.exists() && result.data().favoriteGenres) {
            setSelectedGenres(result.data().favoriteGenres);
          } else {
            // If no genres in Firestore, ensure selectedGenres is empty
            setSelectedGenres([]);
          }
        } catch (error) {
          console.log('Firestore query timed out or failed:', error);
          setSelectedGenres([]); // Reset genres on error
        }
      } else {
        // If not logged in or coming from signup with no AsyncStorage data, reset genres
        setSelectedGenres([]);
      }
    } catch (error) {
      console.log('Error loading user genres:', error);
      setSelectedGenres([]); // Reset genres on error
    } finally {
      setInitialLoading(false);
    }
  }, [isFromSignup, fastLoad, auth.currentUser, db]); // Add dependencies

  // Use useFocusEffect to load genres when the screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("[GenreScreen] Screen focused, loading genres...");
      loadUserGenres();
    }, [loadUserGenres]) // Dependency array includes the memoized loadUserGenres
  );

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }, []);

  const saveGenres = async () => {
    if (selectedGenres.length === 0) {
      Alert.alert('Please select at least one genre');
      return;
    }

    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('User data not found');
      }
      
      const parsedUserData = JSON.parse(userData);
      
      const updatedUserData = {
        ...parsedUserData,
        favoriteGenres: selectedGenres
      };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      // If user is coming from signup, clear the fromSignup flag
      if (isFromSignup) {
        await AsyncStorage.removeItem('fromSignup');
      }
      
      // Navigate directly to the home page without showing an alert
      router.replace('/(tabs)/');
      
      // Update Firestore in the background after navigation
      setTimeout(() => {
        updateFirestoreInBackground(parsedUserData, selectedGenres);
      }, 100);
      
    } catch (error) {
      console.log('Error saving genres:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateFirestoreInBackground = async (userData, genres) => {
    try {
      if (!genres || !Array.isArray(genres)) {
        console.log("[Genres] Invalid genres data:", genres);
        return;
      }

      // Make sure we have user identification
      const userId = auth.currentUser?.uid || userData.uid;
      if (!userId) {
        console.log("[Genres] No user ID available for Firestore update");
        return;
      }

      console.log(`[Genres] Updating Firestore with genres for user ${userId}:`, genres);
      const userDocRef = doc(db, "users", userId);

      // First check if document exists
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        // Update existing document with genres
        await setDoc(userDocRef, {
          favoriteGenres: genres,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("[Genres] Successfully updated existing user document with genres");
      } else {
        // Create new document with proper structure
        await setDoc(userDocRef, {
          favoriteGenres: genres,
          email: userData.email || auth.currentUser?.email || "",
          username: userData.displayName || auth.currentUser?.displayName || "",
          displayName: userData.displayName || auth.currentUser?.displayName || "",
          attendedConcerts: [],
          savedConcerts: [],
          bio: "",
          followers: 0,
          following: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          location: {
            city: "",
            state: ""
          },
          profileImageUrl: ""
        });
        console.log("[Genres] Created new user document with complete structure");
      }
      
      // Update local storage with UID if needed
      if (userId !== userData.uid && userData.email) {
        const updatedUserData = { ...userData, uid: userId };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
      
    } catch (error) {
      console.log('Error updating firestore in background:', error);
    }
  };

  const getSpotifyGenres = async () => {
    try {
      setSpotifyLoading(true);
      
      // Get or refresh Spotify token
      const token = await spotify.login();
      
      if (!token) {
        throw new Error("Failed to authenticate with Spotify");
      }
      
      console.log("[GenreScreen] Successfully authenticated with Spotify");
      
      // Fetch top genres
      const topGenres = await spotify.fetchTopGenres(token);
      
      if (topGenres && topGenres.length > 0) {
        console.log("[GenreScreen] Got top genres from Spotify:", topGenres);
        
        // Filter to include only genres that match our available list
        // and add some fuzzy matching to handle capitalization and formatting differences
        const filteredGenres = topGenres.filter(spotifyGenre => {
          // Convert both to lowercase for comparison
          const normalizedSpotifyGenre = spotifyGenre.toLowerCase();
          
          // Try to find a match in our genre list
          return genres.some(appGenre => {
            const normalizedAppGenre = appGenre.toLowerCase();
            
            // Check if the Spotify genre contains the app genre or vice versa
            return normalizedSpotifyGenre.includes(normalizedAppGenre) || 
                   normalizedAppGenre.includes(normalizedSpotifyGenre);
          });
        });
        
        // If we found matches, use those
        if (filteredGenres.length > 0) {
          const matchedGenres = [];
          
          // Map filtered genres to exact matches in our app's genre list
          filteredGenres.forEach(spotifyGenre => {
            const normalizedSpotifyGenre = spotifyGenre.toLowerCase();
            
            genres.forEach(appGenre => {
              const normalizedAppGenre = appGenre.toLowerCase();
              
              if (normalizedSpotifyGenre.includes(normalizedAppGenre) || 
                  normalizedAppGenre.includes(normalizedSpotifyGenre)) {
                // Add the appGenre (with proper capitalization) if not already in the list
                if (!matchedGenres.includes(appGenre)) {
                  matchedGenres.push(appGenre);
                }
              }
            });
          });
          
          setSelectedGenres(matchedGenres);
          Alert.alert("Success", "We've selected genres based on your Spotify preferences!");
        } else {
          // If no matches found
          Alert.alert("No matches found", "We couldn't match your Spotify genres with our available genres. Please select manually.");
        }
      } else {
        Alert.alert("No genres found", "We couldn't find your top genres on Spotify. Please select manually.");
      }
    } catch (error) {
      console.error("[GenreScreen] Spotify genre fetch error:", error);
      Alert.alert("Error", "Failed to get genres from Spotify. Please try again or select manually.");
    } finally {
      setSpotifyLoading(false);
    }
  };

  const renderItem = useCallback(({ item }: { item: string }) => {
    const selected = selectedGenres.includes(item);
    return (
      <TouchableOpacity
        style={[
          globalStyles.genreTile,
          selected ? globalStyles.selectedGenreTile : null,
        ]}
        onPress={() => toggleGenre(item)}
      >      
        <Text
          style={[
            globalStyles.genreText,
            selected ? globalStyles.selectedGenreText : null,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedGenres, toggleGenre]);
  
  if (initialLoading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <Text style={{color: '#fff', marginBottom: 10}}>Setting up your preferences...</Text>
        <ActivityIndicator size="large" color="#4285F4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.container, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={globalStyles.genreTitle}>
          {isFromSignup 
            ? "Welcome! Select Your Music Taste" 
            : "Update Your Music Preferences"}
        </Text>
        <Text style={globalStyles.genreSubtitle}>
          {isFromSignup 
            ? "These will help us recommend concerts you'll love."
            : "Select the genres you're currently interested in."}
        </Text>

        {!isFromSignup && (
          <TouchableOpacity 
            style={styles.spotifyButton}
            disabled={spotifyLoading}
            onPress={getSpotifyGenres}
          >
            {spotifyLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome name="spotify" size={20} color="#1DB954" style={styles.spotifyIcon} />
                <Text style={styles.spotifyButtonText}>Import from Spotify</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <FlatList
          data={genres}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          numColumns={2}
          contentContainerStyle={globalStyles.genreGrid}
          initialNumToRender={15}
          scrollEnabled={false} // Disable FlatList scrolling since we're using ScrollView
          removeClippedSubviews={false}
        />

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {selectedGenres.length} of {genres.length} selected
          </Text>
        </View>
      
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveGenres}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isFromSignup ? "Complete Setup" : "Save Changes"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40, // Add extra padding at the bottom
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Increase bottom padding
    paddingTop: 20,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Add more space at the bottom
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spotifyButton: {
    backgroundColor: '#191414',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  spotifyIcon: {
    marginRight: 8,
  },
  spotifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  countContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  countText: {
    color: '#888',
    fontSize: 14,
  },
});

export default GenreScreen;
