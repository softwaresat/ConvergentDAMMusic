import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../hooks/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import globalStyles from '../../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import MusicPlayer, { MusicPlayerRef } from '../../components/MusicPlayer';
import { useMusicUpload, MusicTrackInfo } from '../../hooks/useMusicUpload';
import { Audio } from 'expo-av';

type Concert = {
  id: string;
  artistName: string;
  venueName: string;
  genre: string;
  date: string;
  price: string;
  imageUrl: string;
  musicTrack?: MusicTrackInfo;
};

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Concert | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [didInitialLoad, setDidInitialLoad] = useState(false);
  const playerRef = useRef<MusicPlayerRef>(null);
  
  const { uploadMusicFile, deleteMusicTrack, isUploading, error } = useMusicUpload();

  // Set up audio permissions on component mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        console.log("Requesting audio permissions...");
        const permission = await Audio.requestPermissionsAsync();
        console.log("Audio permission result:", permission);
        
        // Initialize Audio
        await Audio.setIsEnabledAsync(true);
        
        // Configure audio session to work best for music playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
        });
      } catch (error) {
        console.error("Error setting up audio:", error);
        Alert.alert(
          "Audio Setup Error",
          "There was a problem setting up audio. Music playback might not work correctly."
        );
      }
    };
    
    setupAudio();
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventId = Array.isArray(id) ? id[0] : id;
        const ref = doc(db, 'concerts', eventId);
        const snapshot = await getDoc(ref);
        
        if (snapshot.exists()) {
          const eventData = { 
            id: snapshot.id, 
            ...(snapshot.data() as Omit<Concert, 'id'>) 
          };
          setEvent(eventData);
          
          // Don't automatically show the player on load, but make it available
          if (eventData.musicTrack?.url) {
            console.log("Found music track URL:", eventData.musicTrack.url);
          }
          
          setDidInitialLoad(true);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        Alert.alert(
          "Error Loading Event",
          "There was a problem loading the event details. Please try again."
        );
      }
    };
    
    // Check if user is admin (for development/testing purposes)
    const checkAdminStatus = async () => {
      // For demo purposes, let's consider any authenticated user as admin
      const user = auth.currentUser;
      setIsAdmin(!!user);
    };
    
    fetchEvent();
    checkAdminStatus();
  }, [id]);

  const handleTogglePlayback = async () => {
    if (!event?.musicTrack?.url) {
      console.error("No music track URL available");
      return;
    }
    
    console.log("Toggle playback called with URL:", event.musicTrack.url);
    console.log("Current state - showMusicPlayer:", showMusicPlayer, "isAudioPlaying:", isAudioPlaying);
    
    try {
      if (showMusicPlayer) {
        // Player is already showing, toggle play state
        if (isAudioPlaying) {
          console.log("Attempting to pause...");
          const result = await playerRef.current?.pause();
          console.log("Pause result:", result);
          setIsAudioPlaying(false);
        } else {
          console.log("Attempting to play...");
          const result = await playerRef.current?.play();
          console.log("Play result:", result);
          setIsAudioPlaying(true);
        }
      } else {
        // Player isn't showing yet, show it
        console.log("Showing player and setting autoPlay");
        setShowMusicPlayer(true);
        
        // We need to give the component time to mount before setting autoPlay
        setTimeout(() => {
          setIsAudioPlaying(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
      Alert.alert(
        "Playback Error",
        "There was a problem playing the music. Please try again."
      );
    }
  };

  const handleUploadTrack = async () => {
    if (!event) return;
    
    try {
      const trackInfo = await uploadMusicFile(event.id, event.artistName);
      if (trackInfo) {
        // Update the local state with the new track info
        setEvent(prev => prev ? {...prev, musicTrack: trackInfo} : null);
        
        // Show the player and start playback
        setShowMusicPlayer(true);
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error('Failed to upload track:', error);
      Alert.alert('Upload Failed', 'Could not upload the music track. Please try again.');
    }
  };
  
  const handleDeleteTrack = async () => {
    if (!event || !event.musicTrack?.url) return;
    
    Alert.alert(
      'Delete Music Track',
      'Are you sure you want to delete this music track?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteMusicTrack(event.id, event.musicTrack!.url);
            if (success) {
              setEvent(prev => prev ? {...prev, musicTrack: undefined} : null);
              setShowMusicPlayer(false);
              setIsAudioPlaying(false);
            } else {
              Alert.alert('Delete Failed', 'Could not delete the music track. Please try again.');
            }
          }
        }
      ]
    );
  };

  const showDebugInfo = () => {
    if (!event?.musicTrack) return;
    
    Alert.alert(
      "Music Debug Info",
      `Track URL: ${event.musicTrack.url.substring(0, 50)}...\n` +
      `Track name: ${event.musicTrack.name}\n` +
      `Player visible: ${showMusicPlayer}\n` +
      `Is playing: ${isAudioPlaying}\n` +
      `Player ref exists: ${!!playerRef.current}`
    );
  };

  if (!event) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={{ color: 'white', marginTop: 16 }}>Loading event details...</Text>
      </View>
    );
  }

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

            {/* 🎵 Music Player Section */}
            {event.musicTrack?.url && showMusicPlayer && (
              <View style={{ marginBottom: 24 }}>
                <Text style={globalStyles.subheading}>Music Preview</Text>
                <MusicPlayer 
                  ref={playerRef}
                  trackUrl={event.musicTrack.url} 
                  trackTitle={`${event.artistName} - ${event.musicTrack.name}`} 
                  autoPlay={isAudioPlaying} 
                />
                
                {isAdmin && (
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 0, 0, 0.2)',
                      padding: 8,
                      borderRadius: 6,
                      marginTop: 8 
                    }}
                    onPress={handleDeleteTrack}
                  >
                    <MaterialIcons name="delete" size={18} color="#FF6B6B" />
                    <Text style={{ color: '#FF6B6B', marginLeft: 6, fontSize: 14 }}>Remove Music Track</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 🎤 Artist */}
            <Text style={globalStyles.subheading}>Artist</Text>
            <View style={globalStyles.rowBox}>
              <View style={globalStyles.iconRow}>
                <MaterialIcons name="account-circle" size={24} color="white" />
                <Text style={globalStyles.infoText}>{event.artistName}</Text>
              </View>
              
              {event.musicTrack?.url ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity 
                    style={globalStyles.playButton}
                    onPress={handleTogglePlayback}
                  >
                    <MaterialIcons 
                      name={isAudioPlaying ? "pause" : "play-arrow"} 
                      size={20} 
                      color="white" 
                    />
                    <Text style={globalStyles.playText}>
                      {isAudioPlaying 
                        ? "Pause music demo" 
                        : "Play music demo"
                      }
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Debug button - only visible in development */}
                  {__DEV__ && (
                    <TouchableOpacity 
                      style={[globalStyles.playButton, { backgroundColor: '#444', marginLeft: 8 }]}
                      onPress={showDebugInfo}
                    >
                      <MaterialIcons name="bug-report" size={20} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : isAdmin ? (
                <TouchableOpacity 
                  style={globalStyles.playButton}
                  onPress={handleUploadTrack}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="upload" size={20} color="white" />
                      <Text style={globalStyles.playText}>Upload Music</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
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
