// app/genres.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import globalStyles from '../../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const genres = [
  'Pop', 'Jazz', 'Rock', 'Hip-Hop', 'Classical',
  'EDM', 'Country', 'R&B', 'Folk', 'Blues',
  'K-pop', 'Metal', 'Indie', 'Reggae', 'Disco'
];

const GenreScreen = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const fastLoad = params.fastLoad === 'true';
  
  const db = getFirestore();
  const auth = getAuth();
  
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

  useEffect(() => {
    const loadUserGenres = async () => {
      try {
        if (fastLoad && isFromSignup) {
          setInitialLoading(false);
          return;
        }
        
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          
          if (parsedUserData.favoriteGenres && parsedUserData.favoriteGenres.length > 0) {
            setSelectedGenres(parsedUserData.favoriteGenres);
            setInitialLoading(false);
            return;
          }
        }
        
        if (!isFromSignup) {
          if (auth.currentUser) {
            const timeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firestore query timeout')), 2000)
            );
            
            try {
              const userDocRef = doc(db, "users", auth.currentUser.uid);
              const firestorePromise = getDoc(userDocRef);
              
              const result = await Promise.race([firestorePromise, timeout]);
              
              if (result && result.exists() && result.data().favoriteGenres) {
                setSelectedGenres(result.data().favoriteGenres);
              }
            } catch (error) {
              console.log('Firestore query timed out or failed:', error);
            }
          }
        }
      } catch (error) {
        console.log('Error loading user genres:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadUserGenres();
  }, [isFromSignup, fastLoad, auth.currentUser, db]);

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
        const updatedUserData = await AsyncStorage.getItem('userData');
        if (updatedUserData) {
          await AsyncStorage.setItem('userData', JSON.stringify({
            ...JSON.parse(updatedUserData),
            uid: userId
          }));
          console.log("[Genres] Updated local storage with user ID");
        }
      }
    } catch (error) {
      console.log('[Genres] Error updating Firestore:', error);
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
});

export default GenreScreen;
