import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../hooks/firebase';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import globalStyles from '../../styles/globalStyles';

export default function HomeScreen() {
  const router = useRouter();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const concertsCollection = collection(db, 'concerts');
        const snapshot = await getDocs(concertsCollection);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConcerts(data);
      } catch (err) {
        console.error('❌ Firestore fetch error:', err);
        setError('Failed to fetch concerts.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcerts();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* 🔍 Search and Filter Bar */}
      <View style={globalStyles.searchBar}>
        <MaterialIcons name="search" size={20} color="#888" style={globalStyles.searchIcon} />
        <TextInput
          style={globalStyles.searchInput}
          placeholder="Find performances"
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={() => router.push('/filter')}>
          <MaterialIcons name="tune" size={20} color="#888" style={globalStyles.filterIcon} />
        </TouchableOpacity>
      </View>

      {/* 🎵 Concert List */}
      <FlatList
        data={concerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              console.log('Navigating to:', `/event/${item.id}`);
              router.push(`/event/${item.id}`);
            }}
          >
            <ThemedView style={globalStyles.postContainer}>
              <ImageBackground source={{ uri: item.imageUrl }} style={globalStyles.posterImage}>
                <View style={globalStyles.overlay}>
                  {/* 🎤 Artist Row */}
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

                  {/* 📍 Venue + Genre */}
                  <View style={globalStyles.infoRow}>
                    <MaterialIcons name="location-on" size={20} color="white" />
                    <Text style={globalStyles.venueName}>{item.venueName}</Text>
                  </View>
                  <View style={globalStyles.infoRow}>
                    <MaterialIcons name="music-note" size={20} color="white" />
                    <Text style={globalStyles.genre}>{item.genre}</Text>
                  </View>

                  {/* 🚀 Bottom Row */}
                  <View style={globalStyles.bottomContainer}>
                    <View style={globalStyles.playButton}>
                      <MaterialIcons name="play-arrow" size={20} color="red" />
                      <Text style={globalStyles.playText}>Play music demo</Text>
                    </View>
                    <View style={globalStyles.priceContainer}>
                      <Text style={globalStyles.price}>{item.price}</Text>
                      <Text style={globalStyles.date}>{item.date}</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </ThemedView>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
