import React, { useEffect, useState } from 'react';
import { Image, TouchableOpacity, ImageBackground } from 'react-native';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../hooks/firebase';
import { useAuth } from '../_layout';
import globalStyles from '../../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    uid?: string,
    displayName?: string,
    email?: string,
    attendedConcerts?: string[],
    favoriteGenres?: string[]
  }>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get user data from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserData(userData);
        
        // If user has attended concerts, fetch their details
        if (userData.attendedConcerts && userData.attendedConcerts.length > 0) {
          fetchUserConcerts(userData.attendedConcerts);
        } else {
          // Fetch recommended concerts instead
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
      
      // Fetch each concert by ID
      for (const concertId of concertIds) {
        const concertRef = doc(db, 'concerts', concertId);
        const concertDoc = await getDoc(concertRef);
        
        if (concertDoc.exists()) {
          concertData.push({
            id: concertDoc.id,
            ...concertDoc.data()
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
      
      setConcerts(data);
    } catch (err) {
      console.error('Firestore fetch error:', err);
      setError('Failed to fetch concerts');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Signing out...");
      
      // Clear authentication data from AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      // Update auth context to trigger navigation
      setUser(null);
      
      // Navigate to the login screen
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.profileHeader}>
        <MaterialIcons name="account-circle" size={80} color="white" />
        <Text style={styles.profileName}>{userData.displayName || 'User'}</Text>
        <Text style={styles.profileEmail}>{userData.email || 'No email'}</Text>
        
        {userData.favoriteGenres && userData.favoriteGenres.length > 0 && (
          <View style={styles.genreContainer}>
            <Text style={styles.genreTitle}>Favorite Genres:</Text>
            <View style={styles.genreTags}>
              {userData.favoriteGenres.map(genre => (
                <View key={genre} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.sectionTitle}>
        {userData.attendedConcerts && userData.attendedConcerts.length > 0 
          ? 'Concerts Attended' 
          : 'Recommended Concerts'}
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView style={globalStyles.postContainer}>
              <ImageBackground source={{ uri: item.imageUrl }} style={globalStyles.posterImage}>
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
  },
  genreTitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
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
  }
});

