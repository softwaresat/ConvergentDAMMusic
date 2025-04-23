import React, { useEffect, useState, useCallback } from 'react';
import { Image, TouchableOpacity, ImageBackground, View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, cleanSignOut, auth } from '../../hooks/firebase';
import { useAuth } from '../_layout';
import globalStyles from '../../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSpotify } from '../../hooks/useSpotify';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as NetInfo from '@react-native-community/netinfo';

export default function ProfileScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [userData, setUserData] = useState<{
    uid?: string;
    displayName?: string;
    email?: string;
    attendedConcerts?: string[];
    favoriteGenres?: string[];
  }>({});

  // Initialize Spotify hook
  const { login, fetchTopGenres, logout } = useSpotify();

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);

      const userDataStr = await AsyncStorage.getItem('userData');
      let userData = {};

      if (userDataStr) {
        userData = JSON.parse(userDataStr);
        setUserData(userData);

        if (auth.currentUser) {
          try {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const firestoreData = userDoc.data();
              console.log('[Profile] Loaded user data from Firestore:', firestoreData);

              const mergedData = {
                ...userData,
                ...firestoreData,
                uid: auth.currentUser.uid,
              };

              setUserData(mergedData);
              await AsyncStorage.setItem('userData', JSON.stringify(mergedData));
            } else {
              console.log("[Profile] User document doesn't exist in Firestore");
            }
          } catch (firestoreErr) {
            console.error('[Profile] Error fetching user data from Firestore:', firestoreErr);
          }
        }

        if (userData.attendedConcerts && userData.attendedConcerts.length > 0) {
          fetchUserConcerts(userData.attendedConcerts);
        } else {
          fetchConcerts();
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  const fetchUserConcerts = async (concertIds: string[]) => {
    try {
      const concertData = [];

      for (const concertId of concertIds) {
        if (!concertId || typeof concertId !== 'string') {
          console.warn('🚫 Skipping invalid concertId:', concertId);
          continue;
        }

        const concertRef = doc(db, 'concerts', concertId);
        const concertDoc = await getDoc(concertRef);

        if (concertDoc.exists()) {
          concertData.push({
            id: concertDoc.id,
            ...concertDoc.data(),
          });
        }
      }

      setConcerts(concertData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user concerts:', err);
      setError('Failed to fetch concert data');
      setLoading(false);
    }
  };

  const fetchConcerts = async () => {
    try {
      const concertsCollection = collection(db, 'concerts');
      const snapshot = await getDocs(concertsCollection);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setConcerts(data.slice(0, 5));
    } catch (err) {
      console.error('Firestore fetch error:', err);
      setError('Failed to fetch concerts');
    } finally {
      setLoading(false);
    }
  };

  const updateFavoriteGenres = async (genres: string[]) => {
    try {
      if (!genres || !Array.isArray(genres) || genres.length === 0) {
        throw new Error('Invalid genres data');
      }

      setUserData(prevData => ({
        ...prevData,
        favoriteGenres: genres,
      }));

      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const updatedUserData = {
          ...userData,
          favoriteGenres: genres,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      }

      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(
          userDocRef,
          {
            favoriteGenres: genres,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      Alert.alert('Success', 'Your favorite genres have been updated with your Spotify preferences!');
    } catch (err) {
      console.error('Error updating favorite genres:', err);
      Alert.alert('Error', 'Failed to update your favorite genres. Please try again.');
    }
  };

  const handleSpotifyIntegration = async () => {
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        Alert.alert('No Connection', 'Please check your internet connection and try again');
        return;
      }

      setSpotifyLoading(true);

      // Force logout to clear any potentially invalid tokens
      await logout(); // Call logout first to ensure we get a fresh token
      
      const token = await login();
      if (!token) {
        throw new Error('Failed to authenticate with Spotify');
      }

      // Get top genres from Spotify
      const topGenres = await fetchTopGenres(token);
      
      // Import the app's genre list to filter any current genres that don't exist in the app
      const { genres: appGenres } = await import('../../app/(tabs)/genres_poll');
      
      if (topGenres && topGenres.length > 0) {
        // Before updating, check if user already has genres
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          
          // If user already has genres, merge with Spotify genres but only keep valid ones
          if (userData.favoriteGenres && userData.favoriteGenres.length > 0) {
            console.log("[Profile] Current user genres:", userData.favoriteGenres);
            
            // Filter current genres to keep only valid ones from the app's genre list
            const validExistingGenres = userData.favoriteGenres.filter(genre => 
              appGenres.includes(genre)
            );
            
            console.log("[Profile] Valid existing genres:", validExistingGenres);
            
            // Merge with new Spotify genres (avoiding duplicates)
            const mergedGenres = [...new Set([...validExistingGenres, ...topGenres])];
            console.log("[Profile] Merged genres:", mergedGenres);
            
            // Update with the merged list
            await updateFavoriteGenres(mergedGenres);
            return;
          }
        }
        
        // If no existing genres, just use the Spotify ones
        await updateFavoriteGenres(topGenres);
      } else {
        throw new Error('Could not retrieve your genre preferences from Spotify');
      }
    } catch (err) {
      console.error('Spotify integration error:', err);
      Alert.alert(
        'Spotify Error',
        `Error: ${err.message || 'Unknown error'}. Make sure you've registered the redirect URI in your Spotify Developer Dashboard.`
      );
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await cleanSignOut();
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.profileHeader}>
        <MaterialIcons name="account-circle" size={80} color="white" />
        <Text style={styles.profileName}>{userData.displayName || 'User'}</Text>
        <Text style={styles.profileEmail}>{userData.email || 'No email'}</Text>

        {userData.favoriteGenres && userData.favoriteGenres.length > 0 ? (
          <View style={styles.genreContainer}>
            <View style={styles.genreHeaderRow}>
              <Text style={styles.genreTitle}>Favorite Genres:</Text>
              <TouchableOpacity
                style={styles.editGenresButton}
                onPress={() => router.push('/(tabs)/genres_poll')}
              >
                <MaterialIcons name="edit" size={16} color="#4285F4" />
                <Text style={styles.editGenresText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.genreTags}>
              {userData.favoriteGenres.map(genre => (
                <View key={genre} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.genreContainer}>
            <Text style={styles.noGenresText}>No favorite genres selected</Text>
            <TouchableOpacity
              style={styles.selectGenresButton}
              onPress={() => router.push('/(tabs)/genres_poll')}
            >
              <Text style={styles.selectGenresText}>Select Genres</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Spotify Integration Button */}
        <TouchableOpacity 
          style={styles.spotifyButton} 
          onPress={handleSpotifyIntegration}
          disabled={spotifyLoading}
        >
          {spotifyLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="spotify" size={20} color="#1DB954" style={styles.spotifyIcon} />
              <Text style={styles.spotifyButtonText}>Get Genre Recommendations</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.sectionTitle}>
        {userData.attendedConcerts && userData.attendedConcerts.length > 0
          ? 'Concerts Attended'
          : 'Bookmarked Concerts'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF0000" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : concerts.length === 0 ? (
        <Text style={styles.noDataText}>No concerts to display</Text>
      ) : (
        <FlatList
          data={concerts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.concertsList}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <ThemedView style={globalStyles.postContainer}>
              <ImageBackground
                source={{ uri: item.imageUrl }}
                style={globalStyles.posterImage}
              >
                <View style={globalStyles.overlay}>
                <View style={globalStyles.artistRow}>
                    <View style={globalStyles.artistInfo}>
                      <MaterialIcons name="account-circle" size={20} color="white" />
                      <Text style={globalStyles.artistName}>{item.artistName}</Text>
                    </View>
                    <View style={globalStyles.actions}>
                      <MaterialIcons name="ios-share" size={20} color="white" style={globalStyles.iconSpacing} />
                      <MaterialIcons name="bookmark-outline" size={20} color="white" />
                    </View>
                  </View>

                  <View style={globalStyles.infoRow}>
                    <MaterialIcons name="location-on" size={20} color="white" />
                    <Text style={globalStyles.venueName}>{item.venueName}</Text>
                  </View>
                  <View style={globalStyles.infoRow}>
                    <MaterialIcons name="music-note" size={20} color="white" />
                    <Text style={globalStyles.genre}>{item.genre}</Text>
                  </View>

                  <View style={globalStyles.bottomContainer}>
                    <TouchableOpacity style={globalStyles.playButton}>
                      <MaterialIcons name="play-arrow" size={20} color="red" />
                      <Text style={globalStyles.playText}>Play music demo</Text>
                    </TouchableOpacity>

                    <View style={globalStyles.priceContainer}>
                      <Text style={globalStyles.price}>{item.price}</Text>
                      <Text style={globalStyles.date}>{item.date}</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </ThemedView>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  genreContainer: {
    marginVertical: 10,
    alignItems: 'center',
    width: '90%',
  },
  genreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  genreTitle: {
    color: 'white',
    fontSize: 16,
  },
  editGenresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  editGenresText: {
    color: '#4285F4',
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '500',
  },
  genreTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  genreTag: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    margin: 3,
  },
  genreText: {
    color: 'white',
    fontSize: 12,
  },
  noGenresText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  selectGenresButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  selectGenresText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  spotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191414',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  spotifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  spotifyIcon: {
    marginRight: 8,
  },
  debugUriText: {
    color: 'white',
    fontSize: 12,
    marginVertical: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  concertCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  eventTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  eventVenue: {
    color: 'white',
    fontSize: 14,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  ticketButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  concertsList: {
    paddingBottom: 100, // Add significant bottom padding to ensure last item is visible
  },
});
