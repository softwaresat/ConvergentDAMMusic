import { useLocalSearchParams } from 'expo-router';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../hooks/firebase';
import { MaterialIcons } from '@expo/vector-icons';

type Concert = {
    id: string;
    artistName: string;
    venueName: string;
    genre: string;
    date: string;
    price: string;
    imageUrl: string;
  };
  
  const [event, setEvent] = useState<Concert | null>(null);

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Concert | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
    const ref = doc(db, 'concerts', Array.isArray(id) ? id[0] : id);
    const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setEvent({ id: snapshot.id, ...(snapshot.data() as Omit<Concert, 'id'>) });
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return <Text style={{ color: 'white', padding: 20 }}>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: event.imageUrl }} style={styles.image} />

      <Text style={styles.sectionTitle}>Event Overview</Text>
      <Text style={styles.description}>
        Artist at this venue is playing her original songs from her new album. This is an event held on campus at {event.venueName}.
      </Text>

      <Text style={styles.subheading}>Artist</Text>
      <View style={styles.rowBox}>
        <View style={styles.iconRow}>
          <MaterialIcons name="account-circle" size={24} color="white" />
          <Text style={styles.infoText}>{event.artistName}</Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <MaterialIcons name="play-arrow" size={20} color="white" />
          <Text style={styles.playText}>Play music demo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subheading}>Details</Text>
      <View style={styles.detailsBox}>
        <Text style={styles.detailItem}>📍 {event.venueName}</Text>
        <Text style={styles.detailItem}>🎵 {event.genre}</Text>
        <Text style={styles.detailItem}>📅 {event.date}</Text>
        <Text style={styles.detailItem}>💵 {event.price}</Text>
      </View>

      <Text style={styles.subheading}>Interested?</Text>
      <TouchableOpacity style={styles.rsvpButton}>
        <Text style={styles.rsvpText}>RSVP</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    marginBottom: 24,
  },
  subheading: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  rowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: 'white',
    marginLeft: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playText: {
    color: 'white',
    marginLeft: 6,
  },
  detailsBox: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
  },
  detailItem: {
    color: 'white',
    marginVertical: 4,
  },
  rsvpButton: {
    backgroundColor: '#e63946',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  rsvpText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
