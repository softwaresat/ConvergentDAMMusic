import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../hooks/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import globalStyles from '../../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

type Concert = {
  id: string;
  artistName: string;
  venueName: string;
  genre: string;
  date: string;
  price: string;
  imageUrl: string;
};

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
    <ImageBackground
      source={{ uri: event.imageUrl }}
      style={globalStyles.fullscreenBackground}
      blurRadius={25}
    >
      <BlurView intensity={70} tint="dark" style={globalStyles.fullscreenBlurOverlay}>
        <SafeAreaView style={{ flex: 1 }}>
          
          {/* 🔙 Custom Back Button */}
          <TouchableOpacity
            onPress={router.back}
            style={{
              padding: 12,
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 50,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
            {/* 📸 Main image with margin */}
            <Image
              source={{ uri: event.imageUrl }}
              style={[globalStyles.eventImage, { marginBottom: 20 }]}
            />

            {/* 📝 Event Overview */}
            <View style={{ marginBottom: 24 }}>
              <Text style={globalStyles.sectionTitle}>Event Overview</Text>
              <Text style={globalStyles.description}>
                Artist at this venue is playing her original songs from her new album. This is an event held on campus at {event.venueName}.
              </Text>
            </View>

            {/* 🎤 Artist */}
            <Text style={globalStyles.subheading}>Artist</Text>
            <View style={globalStyles.rowBox}>
              <View style={globalStyles.iconRow}>
                <MaterialIcons name="account-circle" size={24} color="white" />
                <Text style={globalStyles.infoText}>{event.artistName}</Text>
              </View>
              <TouchableOpacity style={globalStyles.playButton}>
                <MaterialIcons name="play-arrow" size={20} color="white" />
                <Text style={globalStyles.playText}>Play music demo</Text>
              </TouchableOpacity>
            </View>

            {/* 📋 Details */}
            <Text style={globalStyles.subheading}>Details</Text>
            <View style={globalStyles.detailsBox}>
              <Text style={globalStyles.detailItem}>📍 {event.venueName}</Text>
              <Text style={globalStyles.detailItem}>🎵 {event.genre}</Text>
              <Text style={globalStyles.detailItem}>📅 {event.date}</Text>
              <Text style={globalStyles.detailItem}>💵 {event.price}</Text>
            </View>

            {/* 🧠 RSVP */}
            <Text style={globalStyles.subheading}>Interested?</Text>
            <TouchableOpacity style={globalStyles.rsvpButton}>
              <Text style={globalStyles.rsvpText}>RSVP</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </BlurView>
    </ImageBackground>
  );
}
