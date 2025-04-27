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
  StyleSheet,
  Linking,
  FlatList,
  Modal,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, collection, getDocs, addDoc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db, auth, storage } from '../../hooks/firebase';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import globalStyles from '../../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import MusicPlayer, { MusicPlayerRef } from '../../components/MusicPlayer';
import { useMusicUpload, MusicTrackInfo } from '../../hooks/useMusicUpload';
import { hasLocalMusicFile, loadLocalMusicFile } from '../../hooks/useLocalMusic';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Concert = {
  id: string;
  artistName: string;
  venueName: string;
  venueAddress?: string;
  genre: string;
  date: string;
  price: string;
  imageUrl: string;
  musicTrack?: MusicTrackInfo;
  description?: string;
  ticketUrl?: string;
};

type ConcertPhoto = {
  id: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  concertId: string;
};

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Concert | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [didInitialLoad, setDidInitialLoad] = useState(false);
  const [isUserAttended, setIsUserAttended] = useState(false);
  const [photos, setPhotos] = useState<ConcertPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [localMusicAvailable, setLocalMusicAvailable] = useState(false);
  const [localMusicUri, setLocalMusicUri] = useState<string | null>(null);
  const [usingLocalMusic, setUsingLocalMusic] = useState(false);
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

    // Check if user has attended this concert
    const checkAttendanceStatus = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.attendedConcerts && Array.isArray(userData.attendedConcerts)) {
            const eventId = Array.isArray(id) ? id[0] : id;
            setIsUserAttended(userData.attendedConcerts.includes(eventId));
          }
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
      }
    };
    
    // Check if user is admin (for development/testing purposes)
    const checkAdminStatus = async () => {
      // For demo purposes, let's consider any authenticated user as admin
      const user = auth.currentUser;
      setIsAdmin(!!user);
    };
    
    fetchEvent();
    fetchConcertPhotos();
    checkAttendanceStatus();
    checkAdminStatus();
  }, [id]);

  // Add a check for local music files when the event is loaded
  useEffect(() => {
    const checkLocalMusic = async () => {
      if (!event) return;
      
      // Check if this artist has a local music file
      const hasLocal = hasLocalMusicFile(event.artistName);
      setLocalMusicAvailable(hasLocal);
      
      if (hasLocal) {
        try {
          // Load the local music file
          const uri = await loadLocalMusicFile(event.artistName);
          if (uri) {
            console.log(`Local music file found for ${event.artistName}:`, uri);
            setLocalMusicUri(uri);
          }
        } catch (error) {
          console.error('Error loading local music file:', error);
        }
      }
    };
    
    checkLocalMusic();
  }, [event]);

  const fetchConcertPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const eventId = Array.isArray(id) ? id[0] : id;
      
      const photosQuery = query(
        collection(db, 'concertPhotos'),
        where('concertId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(photosQuery);
      
      const photoData: ConcertPhoto[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ConcertPhoto));
      
      setPhotos(photoData);
    } catch (error) {
      console.error('Error fetching concert photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!auth.currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to upload photos.');
      return;
    }
    
    try {
      // Request camera roll permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return;
      }
      
      // Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (result.canceled) return;
      
      const image = result.assets[0];
      setUploading(true);
      
      // Get image data
      const response = await fetch(image.uri);
      const blob = await response.blob();
      
      // Get user data
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : {};
      const displayName = userData.displayName || 'Anonymous User';
      
      // Generate a unique filename
      const eventId = Array.isArray(id) ? id[0] : id;
      const fileName = `concert_photos/${eventId}/${auth.currentUser.uid}_${Date.now()}`;
      const storageRef = ref(storage, fileName);
      
      // Upload to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress monitoring if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% complete`);
        },
        (error) => {
          console.error('Upload error:', error);
          Alert.alert('Upload Failed', 'Failed to upload your photo. Please try again.');
          setUploading(false);
        },
        async () => {
          // Upload completed, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save photo metadata to Firestore
          const photoData = {
            concertId: eventId,
            imageUrl: downloadURL,
            uploadedBy: auth.currentUser.uid,
            uploadedByName: displayName,
            createdAt: new Date().toISOString(),
          };
          
          await addDoc(collection(db, 'concertPhotos'), photoData);
          
          // Update local state
          setPhotos(prev => [{
            id: `temp_${Date.now()}`,
            ...photoData,
          } as ConcertPhoto, ...prev]);
          
          Alert.alert('Success', 'Your photo has been uploaded!');
          setUploading(false);
        }
      );
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Error', 'There was a problem uploading your photo. Please try again.');
      setUploading(false);
    }
  };

  const markAsAttended = async () => {
    if (!auth.currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to mark this concert as attended.');
      return;
    }
    
    try {
      const eventId = Array.isArray(id) ? id[0] : id;
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const attendedConcerts = userData.attendedConcerts || [];
        
        if (!attendedConcerts.includes(eventId)) {
          const updatedConcerts = [...attendedConcerts, eventId];
          
          // Update Firestore
          await updateDoc(userDocRef, {
            attendedConcerts: updatedConcerts,
          });
          
          // Update local storage
          const userDataStr = await AsyncStorage.getItem('userData');
          if (userDataStr) {
            const localUserData = JSON.parse(userDataStr);
            localUserData.attendedConcerts = updatedConcerts;
            await AsyncStorage.setItem('userData', JSON.stringify(localUserData));
          }
          
          setIsUserAttended(true);
          Alert.alert('Success', 'This concert has been added to your past concerts!');
        } else {
          Alert.alert('Already Attended', 'This concert is already in your past concerts.');
        }
      }
    } catch (error) {
      console.error('Error marking concert as attended:', error);
      Alert.alert('Error', 'Failed to update your attended concerts. Please try again.');
    }
  };

  // Handle toggle playback function - updated to handle local music
  const handleTogglePlayback = async () => {
    // If using local music, prioritize it
    const shouldUseLocal = localMusicAvailable && localMusicUri;
    
    // Check if we have any music to play (either local or remote)
    if (!shouldUseLocal && !event?.musicTrack?.url) {
      console.error("No music track available");
      Alert.alert('No Music Available', 'There is no music track available for this artist.');
      return;
    }
    
    try {
      // If player is showing, just toggle play state
      if (showMusicPlayer) {
        if (isAudioPlaying) {
          console.log("Pausing playback...");
          const result = await playerRef.current?.pause();
          console.log("Pause result:", result);
          setIsAudioPlaying(false);
        } else {
          console.log("Resuming playback...");
          const result = await playerRef.current?.play();
          console.log("Play result:", result);
          setIsAudioPlaying(true);
        }
      } else {
        // If not showing, set up the player with either local or remote URL
        if (shouldUseLocal) {
          console.log("Using local music file:", localMusicUri);
          setUsingLocalMusic(true);
        } else {
          console.log("Using remote music URL:", event.musicTrack.url);
          setUsingLocalMusic(false);
        }
        
        console.log("Showing player and setting autoPlay");
        setShowMusicPlayer(true);
        
        // Give the component time to mount before setting autoPlay
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

  // Show debug info - updated for local music
  const showDebugInfo = () => {
    const musicInfo = usingLocalMusic ? 
      { source: 'Local', uri: localMusicUri } : 
      (event?.musicTrack ? { source: 'Remote', uri: event.musicTrack.url } : { source: 'None', uri: null });
    
    Alert.alert(
      "Music Debug Info",
      `Artist: ${event?.artistName}\n` +
      `Source: ${musicInfo.source}\n` +
      `URI: ${musicInfo.uri?.substring(0, 50)}...\n` +
      `Player visible: ${showMusicPlayer}\n` +
      `Is playing: ${isAudioPlaying}\n` +
      `Player ref exists: ${!!playerRef.current}`
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      // Format: Fri, March 28th • 6:30 PM
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleDateString('en-US', options).replace(',', '');
    } catch (error) {
      return dateString; // Return original string if there's an error
    }
  };

  const openMaps = (venue: string, address?: string) => {
    const query = encodeURIComponent(address || venue);
    
    // Handle iOS devices
    if (Platform.OS === 'ios') {
      // Try Apple Maps first (most reliable on iOS)
      const appleMapsUrl = `maps:?q=${query}&address=${query}`;
      
      Linking.canOpenURL(appleMapsUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(appleMapsUrl);
          } else {
            // If Apple Maps URL scheme isn't supported, try Google Maps app URL
            const googleMapsIosUrl = `comgooglemaps://?q=${query}`;
            return Linking.canOpenURL(googleMapsIosUrl)
              .then(hasGoogleMaps => {
                if (hasGoogleMaps) {
                  return Linking.openURL(googleMapsIosUrl);
                } else {
                  // Last resort: open in browser
                  return Linking.openURL(`https://maps.apple.com/?q=${query}`);
                }
              });
          }
        })
        .catch(err => {
          console.error('Error opening maps on iOS:', err);
          // Fallback to web
          Linking.openURL(`https://maps.google.com/maps?q=${query}`);
        });
    } 
    // Handle Android devices
    else {
      // Try native Android intent
      const androidMapsUrl = `geo:0,0?q=${query}`;
      
      Linking.canOpenURL(androidMapsUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(androidMapsUrl);
          } else {
            // If no map app handles the geo URI, try Google Maps directly
            const googleMapsUrl = `https://maps.google.com/maps?q=${query}`;
            return Linking.openURL(googleMapsUrl);
          }
        })
        .catch(err => {
          console.error('Error opening maps on Android:', err);
          Linking.openURL(`https://maps.google.com/maps?q=${query}`);
        });
    }
  };

  if (!event) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={{ color: 'white', marginTop: 16 }}>Loading event details...</Text>
      </View>
    );
  }

  // Format date for display (e.g., "Fri, March 28th • 6:30 PM")
  const formattedDate = formatDate(event.date);
  const venueAddress = event.venueAddress || "1320 S Lamar Blvd"; // Default address if none provided

  return (
    <ImageBackground
      source={{ uri: event.imageUrl }}
      style={styles.imageBackground}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Nav Bar with Back Button and Action Buttons */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={router.back} style={styles.navButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.rightButtons}>
            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
            {isUserAttended ? (
              <TouchableOpacity style={styles.navButton}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.navButton}
                onPress={markAsAttended}
              >
                <Ionicons name="add-circle-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Main Event Image */}
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {/* Performance Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <Text style={styles.description}>
              {event.description || `${event.artistName} is an indie rock band who will be playing their original songs from their latest album, Severance. This performance will held at the ${event.venueName}.`}
            </Text>
          </View>

          {/* Artist Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artist</Text>
            <View style={styles.artistRow}>
              <View style={styles.artistButton}>
                <Ionicons name="person-circle" size={24} color="#ff585d" />
                <Text style={styles.artistName}>{event.artistName}</Text>
              </View>

              {/* Music Demo Button - show differently if local music is available */}
              <TouchableOpacity 
                style={[
                  styles.musicDemoButton, 
                  localMusicAvailable ? { backgroundColor: '#4CAF50' } : {}
                ]}
                onPress={handleTogglePlayback}
              >
                <Ionicons name={isAudioPlaying ? "pause" : "play"} size={24} color="white" />
                <Text style={styles.musicDemoText}>
                  {localMusicAvailable ? 'Play Demo' : 'Play music demo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsBox}>
              {/* Venue */}
              <View style={styles.detailRow}>
                <Ionicons name="location" size={24} color="#ff585d" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Venue</Text>
                  <TouchableOpacity onPress={() => openMaps(event.venueName, venueAddress)}>
                    <Text style={styles.detailValue}>{event.venueName} • <Text style={styles.linkText}>{venueAddress}</Text></Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Genre */}
              <View style={styles.detailRow}>
                <Ionicons name="musical-notes" size={24} color="#ff585d" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Genre</Text>
                  <Text style={styles.detailValue}>{event.genre}</Text>
                </View>
              </View>
              
              {/* Date & Time */}
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={24} color="#ff585d" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>{formattedDate}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Concert Photos Section - Only visible for past concerts */}
          {isUserAttended && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Concert Photos</Text>
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={handleUploadPhoto}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={16} color="white" />
                      <Text style={styles.uploadButtonText}>Add Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              {loadingPhotos ? (
                <ActivityIndicator size="large" color="#ff585d" style={styles.photosLoading} />
              ) : photos.length === 0 ? (
                <View style={styles.noPhotosContainer}>
                  <Ionicons name="images-outline" size={60} color="#555" />
                  <Text style={styles.noPhotosText}>No photos yet</Text>
                  <Text style={styles.noPhotosSubtext}>Be the first to share a memory!</Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={photos}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.photosList}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.photoItem}
                      onPress={() => setSelectedPhoto(item.imageUrl)}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.thumbnail}
                      />
                      <Text style={styles.photoUploader} numberOfLines={1}>
                        {item.uploadedByName}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isUserAttended ? (
              <TouchableOpacity 
                style={[styles.ticketButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleUploadPhoto}
              >
                <Text style={styles.ticketButtonText}>Upload Memory</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.ticketButton}
                onPress={markAsAttended}
              >
                <Text style={styles.ticketButtonText}>RSVP</Text>
              </TouchableOpacity>
            )}
          </View>

          {showMusicPlayer && (
            <View style={styles.musicPlayerContainer}>
              <MusicPlayer 
                ref={playerRef}
                trackUrl={usingLocalMusic ? localMusicUri! : event.musicTrack?.url!} 
                trackTitle={usingLocalMusic 
                  ? `${event.artistName} - Local Demo` 
                  : `${event.artistName} - ${event.musicTrack?.name || 'Music Demo'}`} 
                autoPlay={isAudioPlaying} 
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Full-size photo modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  imageBackground: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 50,
  },
  navButton: {
    padding: 8,
  },
  rightButtons: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  mainImage: {
    width: '100%',
    height: 250,
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
  artistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  artistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 88, 93, 0.15)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 10,
  },
  artistName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  musicDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff585d',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  musicDemoText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  detailsBox: {
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    borderRadius: 8,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#4a90e2',
  },
  actionsContainer: {
    padding: 15,
    marginBottom: 30,
  },
  ticketButton: {
    backgroundColor: '#ff585d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  ticketButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  musicPlayerContainer: {
    padding: 15,
    marginBottom: 20,
  },
  // Photo gallery styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 88, 93, 0.8)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  photosList: {
    paddingVertical: 10,
  },
  photoItem: {
    marginRight: 10,
    width: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  photoUploader: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  noPhotosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noPhotosText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
  },
  noPhotosSubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  photosLoading: {
    marginVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
});
