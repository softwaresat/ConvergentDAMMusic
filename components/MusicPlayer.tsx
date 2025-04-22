import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface MusicPlayerProps {
  trackUrl: string;
  trackTitle?: string;
  autoPlay?: boolean;
}

// Define a ref type for external control of the player
export type MusicPlayerRef = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  isPlaying: boolean;
};

const MusicPlayer = forwardRef<MusicPlayerRef, MusicPlayerProps>(({ 
  trackUrl, 
  trackTitle = 'Preview Track',
  autoPlay = false
}, ref) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Expose methods to the parent component via ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      console.log("External play called");
      if (sound && !isPlaying) {
        return await playSound();
      }
      return false;
    },
    pause: async () => {
      console.log("External pause called");
      if (sound && isPlaying) {
        await sound.pauseAsync();
        return true;
      }
      return false;
    },
    get isPlaying() {
      return isPlaying;
    }
  }));

  // Load the sound when the component mounts or trackUrl changes
  useEffect(() => {
    async function loadSound() {
      try {
        if (!trackUrl) {
          setError('No audio track available');
          return;
        }
        
        setIsLoading(true);
        setError(null);

        // Unload any existing sound first
        if (sound) {
          await sound.unloadAsync();
        }

        console.log('Loading sound from:', trackUrl);
        
        try {
          // Set up audio mode first
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
          });
          
          console.log("Audio mode set successfully");
        } catch (audioErr) {
          console.error("Error setting audio mode:", audioErr);
        }
        
        try {
          console.log("Attempting to create sound with autoPlay:", autoPlay);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: trackUrl },
            { shouldPlay: autoPlay },
            onPlaybackStatusUpdate
          );
          
          console.log("Sound created successfully");
          setSound(newSound);
          setIsLoading(false);
          
          if (autoPlay) {
            console.log("AutoPlay is true, setting isPlaying to true");
            setIsPlaying(true);
          }
        } catch (soundErr) {
          console.error("Error creating sound:", soundErr);
          setError(`Failed to load audio: ${soundErr.message}`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in loadSound:', err);
        setError(`Failed to load audio track: ${err.message}`);
        setIsLoading(false);
      }
    }

    loadSound();

    // Cleanup function to unload sound when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [trackUrl, autoPlay]);

  // Monitor playback status
  const onPlaybackStatusUpdate = (status) => {
    if (!status) {
      console.log("Received empty status update");
      return;
    }
    
    console.log("Playback status update:", 
      status.isLoaded ? 
        `isPlaying: ${status.isPlaying}, position: ${status.positionMillis}, duration: ${status.durationMillis}` : 
        "not loaded");
    
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      // Reset when playback finishes
      if (status.didJustFinish) {
        console.log("Playback finished");
        setIsPlaying(false);
        sound?.setPositionAsync(0);
      }
    } else if (status.error) {
      console.error("Playback error:", status.error);
      setError(`Playback error: ${status.error}`);
    }
  };

  const playSound = async () => {
    try {
      console.log("playSound called, checking permissions");
      // Ensure we have audio permissions
      const permissionStatus = await Audio.requestPermissionsAsync();
      console.log("Permission status:", permissionStatus);
      
      if (permissionStatus.granted) {
        if (!sound) {
          console.error("No sound object available");
          setError("Sound not loaded yet");
          return false;
        }
        
        console.log("Calling playAsync on sound object");
        await sound.playAsync();
        console.log("playAsync completed");
        return true;
      } else {
        console.error("Audio permission denied");
        setError('Permission to access audio was denied');
        return false;
      }
    } catch (err) {
      console.error("Error in playSound:", err);
      setError(`Error playing sound: ${err.message}`);
      return false;
    }
  };

  const togglePlayback = async () => {
    if (!sound) {
      console.error("No sound object in togglePlayback");
      return;
    }
    
    try {
      console.log("Toggling playback, current state:", isPlaying);
      if (isPlaying) {
        await sound.pauseAsync();
        console.log("Paused playback");
      } else {
        const result = await playSound();
        console.log("Play result:", result);
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      setError(`Error playing track: ${err.message}`);
    }
  };

  // Format time function (converts milliseconds to mm:ss format)
  const formatTime = (millis: number) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate progress percentage
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{trackTitle}</Text>
      
      {error ? (
        <View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              // Force remount by changing key
              setSound(null);
              if (trackUrl) {
                // Small delay before retry
                setTimeout(() => {
                  // Use Audio.Sound directly instead of through effect
                  Audio.Sound.createAsync(
                    { uri: trackUrl },
                    { shouldPlay: true },
                    onPlaybackStatusUpdate
                  ).then(({sound: newSound}) => {
                    setSound(newSound);
                    setIsLoading(false);
                    setIsPlaying(true);
                  }).catch(err => {
                    console.error("Retry failed:", err);
                    setError(`Retry failed: ${err.message}`);
                    setIsLoading(false);
                  });
                }, 200);
              }
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          
          <View style={styles.controls}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#FF0000" />
            ) : (
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayback}
                disabled={!sound}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={28}
                  color="#FFF"
                />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                "Debug Info",
                `URL: ${trackUrl.substring(0, 50)}...\n` +
                `Sound loaded: ${!!sound}\n` +
                `isPlaying: ${isPlaying}\n` +
                `isLoading: ${isLoading}\n` +
                `Duration: ${duration}\n` +
                `Position: ${position}`
              );
            }}
          >
            <Text style={styles.debugText}>Debug</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginVertical: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeText: {
    color: '#AAA',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#FF0000',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#363636',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  debugButton: {
    backgroundColor: '#222',
    padding: 4,
    borderRadius: 4,
    alignSelf: 'center',
  },
  debugText: {
    color: '#888',
    fontSize: 12,
  },
});

export default MusicPlayer;
