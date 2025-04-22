import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, SafeAreaView, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { collection, getDocs, Firestore } from 'firebase/firestore';
import { db } from '../../hooks/firebase';
import globalStyles from '../../styles/globalStyles';

type Concert = {
  id: string;
  artistName: string;
  venueName: string;
  genre: string;
  date: string;
  price: string;
  imageUrl: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

export default function MapScreen() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        setError(null);
        console.log("[Map] Fetching concerts for map...");
        const concertsCollection = collection(db, 'concerts');
        const snapshot = await getDocs(concertsCollection);

        const concertList: Concert[] = snapshot.docs.map((docSnap) => {
          const rawData = docSnap.data() as any;

          let location = rawData.location;
          if (location && typeof location.latitude === 'function') {
            location = {
              latitude: location.latitude(),
              longitude: location.longitude(),
            };
          }

          const concert: Concert = {
            id: docSnap.id,
            artistName: rawData.artistName,
            venueName: rawData.venueName,
            genre: rawData.genre,
            date: rawData.date,
            price: rawData.price,
            imageUrl: rawData.imageUrl,
            location,
          };

          return concert;
        });

        const validConcerts = concertList.filter(
          (c) =>
            c.location &&
            typeof c.location.latitude === 'number' &&
            typeof c.location.longitude === 'number'
        );

        console.log(`[Map] Found ${validConcerts.length} concerts with valid locations`);
        setConcerts(validConcerts);

        if (validConcerts.length > 0) {
          const first = validConcerts[0].location!;
          setRegion({
            latitude: first.latitude,
            longitude: first.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      } catch (error) {
        console.error('❌ Error fetching concerts:', error);
        setError('Failed to load concerts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcerts();
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!region || !mapRef.current) return;

    const factor = direction === 'in' ? 0.5 : 2;

    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };

    setRegion(newRegion);
    mapRef.current.animateToRegion(newRegion, 300);
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ color: 'white' }}>Loading map...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={globalStyles.centered}>
        <Text style={{ color: 'white', textAlign: 'center', margin: 20 }}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            // Retry fetching concerts
            fetchConcerts();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!region || concerts.length === 0) {
    return (
      <SafeAreaView style={globalStyles.centered}>
        <Text style={{ color: 'white' }}>No concerts with locations found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <MapView
        ref={(ref) => (mapRef.current = ref)}
        style={{ flex: 1 }}
        initialRegion={region}
      >
        {concerts.map((concert) => {
          if (!concert.location) return null;

          return (
            <Marker
              key={concert.id}
              coordinate={concert.location}
              title={`${concert.artistName} @ ${concert.venueName}`}
              description={`${concert.date} • ${concert.genre} • ${concert.price}`}
            >
              <Callout tooltip>
                <View style={{
                  width: 250,
                  backgroundColor: 'white',
                  borderRadius: 10,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <Image source={{ uri: concert.imageUrl }} style={styles.eventImage} />
                  <View style={{ padding: 10 }}>
                    <Text style={styles.calloutTitle}>
                      {concert.artistName} @ {concert.venueName}
                    </Text>
                    <Text style={styles.calloutMeta}>
                      {concert.date} • {concert.genre} • {concert.price}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Zoom buttons */}
      <View
        style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          onPress={() => handleZoom('in')}
          style={{
            padding: 10,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#444',
          }}
        >
          <Text style={{ color: 'white', fontSize: 20 }}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleZoom('out')}
          style={{
            padding: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 20 }}>－</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Define styles locally to avoid the global styles error
const styles = StyleSheet.create({
  eventImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  calloutTitle: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutMeta: {
    color: '#666',
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
