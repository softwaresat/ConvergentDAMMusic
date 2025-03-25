import React, { useEffect, useState} from 'react';
import { Image, TouchableOpacity, ImageBackground } from 'react-native';
import { View, Text, StyleSheet, Dimensions, FlatList, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../hooks/firebase'; // Ensure this import path is correct
import { useRouter } from 'expo-router'; // Import the useRouter hook
import globalStyles from '../../styles/globalStyles'; // adjust path as needed


export default function HomeScreen() {
  console.log('🔥 HomeScreen is mounting...');

  const router = useRouter(); // Initialize the router

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
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.searchBar}>
        <MaterialIcons name="search" size={20} color="#888" style={globalStyles.searchIcon} />
        <TextInput
          style={globalStyles.searchInput}
          placeholder="Find performances"
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={() => router.push('/filter')}> {/* Navigate to filter.tsx */}
          <MaterialIcons name="tune" size={20} color="#888" style={globalStyles.filterIcon} />
        </TouchableOpacity>
      </View>
      
      <FlatList
  data={concerts}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <ThemedView style={globalStyles.postContainer}>
      {/* 🎵 Background Image */}
      <ImageBackground source={{ uri: item.imageUrl }} style={globalStyles.posterImage}>
        {/* 📍 Concert Info Overlay */}
        <View style={globalStyles.overlay}>

          {/* 🎤 Artist Info + Actions (Top Left & Right) */}
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

          {/* 📍 Venue & Genre Info (Below Artist) */}
          <View style={globalStyles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="white" />
            <Text style={globalStyles.venueName}>{item.venueName}</Text>
          </View>
          <View style={globalStyles.infoRow}>
            <MaterialIcons name="music-note" size={20} color="white" />
            <Text style={globalStyles.genre}>{item.genre}</Text>
          </View>

          {/* 🚀 Bottom Section - Play Button (Left) & Price/Date (Right) */}
          <View style={globalStyles.bottomContainer}>
            {/* 🔴 Play Button (Bottom Left) */}
            <TouchableOpacity style={globalStyles.playButton}>
              <MaterialIcons name="play-arrow" size={20} color="red" />
              <Text style={globalStyles.playText}>Play music demo</Text>
            </TouchableOpacity>

            {/* 💲 Price & Date (Bottom Right) */}
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


    </SafeAreaView>
  );
}