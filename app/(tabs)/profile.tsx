import React, { useEffect, useState} from 'react';
import { Image, TouchableOpacity, ImageBackground } from 'react-native';
import { View, Text, StyleSheet, FlatList, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../hooks/firebase'; // Ensure this import path is correct

export default function ProfileScreen() {
  console.log('🔥 HomeScreen is mounting...');

  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect is running...');

    const fetchConcerts = async () => {
      try {
        console.log('📡 Fetching concerts from Firestore...');
        
        const concertsCollection = collection(db, 'concerts');
        console.log('📁 Collection Reference:', concertsCollection);

        const snapshot = await getDocs(concertsCollection);
        console.log('📸 Snapshot size:', snapshot.size);

        if (snapshot.empty) {
          console.warn('⚠️ No concerts found in Firestore.');
        }

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('🎶 Fetched concerts:', JSON.stringify(data, null, 2));

        setConcerts(data);
      } catch (err) {
        console.error('❌ Firestore fetch error:', err);
        setError('Failed to fetch concerts. Check console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcerts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Find performances"
        placeholderTextColor="#888"
      />
      
      <FlatList
  data={concerts}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <ThemedView style={styles.postContainer}>
      {/* 🎵 Background Image */}
      <ImageBackground source={{ uri: item.imageUrl }} style={styles.posterImage}>
        {/* 📍 Concert Info Overlay */}
        <View style={styles.overlay}>

          {/* 🎤 Artist Info + Actions (Top Left & Right) */}
          <View style={styles.artistRow}>
            <View style={styles.artistInfo}>
              <MaterialIcons name="account-circle" size={20} color="white" />
              <Text style={styles.artistName}>{item.artistName}</Text>
            </View>
            <View style={styles.actions}>
              <MaterialIcons name="ios-share" size={20} color="white" style={styles.iconSpacing} />
              <MaterialIcons name="bookmark-outline" size={20} color="white" />
            </View>
          </View>

          {/* 📍 Venue & Genre Info (Below Artist) */}
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="white" />
            <Text style={styles.venueName}>{item.venueName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="music-note" size={20} color="white" />
            <Text style={styles.genre}>{item.genre}</Text>
          </View>

          {/* 🚀 Bottom Section - Play Button (Left) & Price/Date (Right) */}
          <View style={styles.bottomContainer}>
            {/* 🔴 Play Button (Bottom Left) */}
            <TouchableOpacity style={styles.playButton}>
              <MaterialIcons name="play-arrow" size={20} color="red" />
              <Text style={styles.playText}>Play music demo</Text>
            </TouchableOpacity>

            {/* 💲 Price & Date (Bottom Right) */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{item.price}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          </View>

        </View>
      </ImageBackground>
    </ThemedView>
  )}
/>


    </SafeAreaView>
  );
}


import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window'); // Get screen width for scaling

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  searchBar: {
    margin: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    fontSize: width * 0.04, // Scales font size dynamically
    color: 'black',
  },
  postContainer: {
    margin: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
    padding: 12,
    borderRadius: 10,
  },
  /* 🎤 Artist Row (Top Left & Right) */
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Pushes actions to the right
    marginBottom: 5,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    color: 'white',
    fontSize: width * 0.045, // Scaled font size
    fontWeight: 'bold',
    marginLeft: 8,
  },
  /* 🎵 Icons on Right Side */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginRight: 8, // Space between icons
  },
  /* 📍 Venue & Genre Info */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  venueName: {
    color: 'white',
    fontSize: width * 0.04, // Scaled font size
    marginLeft: 8,
  },
  genre: {
    color: 'white',
    fontSize: width * 0.04, // Scaled font size
    marginLeft: 8,
  },
  /* 🚀 Bottom Container (Sticks to Bottom) */
  bottomContainer: {
    position: 'absolute',
    bottom: 10, // Ensures it hugs the bottom
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between', // Left = Play button, Right = Price/Date
    alignItems: 'center',
  },
  /* 🔴 Play Button (Bottom Left) */
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 10,
    alignSelf: 'flex-start', // Sticks to bottom left
  },
  playText: {
    color: 'white',
    fontSize: width * 0.04, // Scaled font size
    marginLeft: 5,
  },
  /* 💲 Price & Date (Bottom Right) */
  priceContainer: {
    alignSelf: 'flex-end', // Align to bottom right
    alignItems: 'flex-end', // Align text to the right
  },
  price: {
    color: 'white',
    fontSize: width * 0.05, // Slightly larger for emphasis
    fontWeight: 'bold',
    marginBottom: 4, // Adds spacing between price & date
  },
  date: {
    color: 'white',
    fontSize: width * 0.04, // Scaled font size
  },
});
