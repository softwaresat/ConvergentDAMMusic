import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getStorage, storageRef, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface MusicTrackInfo {
  url: string;
  name: string;
  duration?: number; // Duration in seconds
  artist?: string;  // Artist name (default to concert artist)
  uploadedAt: number; // Timestamp
}

export const useMusicUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Picks an MP3 file from the device
   */
  const pickAudioFile = async (): Promise<DocumentPicker.DocumentResult> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg', // Only allow MP3 files
        copyToCacheDirectory: true,
      });
      
      return result;
    } catch (err) {
      console.error('Error picking audio file:', err);
      setError('Failed to select audio file');
      throw err;
    }
  };

  /**
   * Uploads an MP3 file to Firebase Storage and updates the concert document
   */
  const uploadMusicFile = async (concertId: string, artistName: string): Promise<MusicTrackInfo | null> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      
      // 1. Pick the audio file
      const pickerResult = await pickAudioFile();
      
      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        setIsUploading(false);
        return null;
      }
      
      const audioFile = pickerResult.assets[0];
      console.log('Selected file:', audioFile.name, audioFile.uri);
      
      // 2. Generate a unique file name
      const timestamp = Date.now();
      const fileExtension = audioFile.name.split('.').pop();
      const fileName = `music/${concertId}_${timestamp}.${fileExtension}`;
      
      // 3. Upload to Firebase Storage
      const storage = getStorage();
      const fileRef = storageRef(storage, fileName);
      
      // Read the file as a blob
      const fileInfo = await FileSystem.getInfoAsync(audioFile.uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      // For progress tracking with larger files
      const fileBlob = await fetch(audioFile.uri).then(r => r.blob());
      
      // Upload the blob
      const uploadResult = await uploadBytes(fileRef, fileBlob);
      
      // 4. Get the download URL
      const downloadUrl = await getDownloadURL(fileRef);
      
      // 5. Update the concert document with the music track info
      const trackInfo: MusicTrackInfo = {
        url: downloadUrl,
        name: audioFile.name,
        artist: artistName,
        uploadedAt: timestamp,
      };
      
      // Update the Firestore document
      const concertRef = doc(db, 'concerts', concertId);
      await updateDoc(concertRef, {
        musicTrack: trackInfo
      });
      
      console.log('Music track uploaded successfully:', downloadUrl);
      setIsUploading(false);
      setProgress(100);
      
      return trackInfo;
      
    } catch (err) {
      console.error('Error uploading music file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload music file');
      setIsUploading(false);
      return null;
    }
  };

  /**
   * Deletes a music track from Firebase Storage and removes the reference from Firestore
   */
  const deleteMusicTrack = async (concertId: string, trackUrl: string): Promise<boolean> => {
    try {
      // Extract the reference from the URL
      const storage = getStorage();
      const fileRef = ref(storage, trackUrl);
      
      // Delete the file from Storage
      await deleteObject(fileRef);
      
      // Remove the reference from Firestore
      const concertRef = doc(db, 'concerts', concertId);
      await updateDoc(concertRef, {
        musicTrack: null
      });
      
      console.log('Music track deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting music track:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete music track');
      return false;
    }
  };

  return {
    pickAudioFile,
    uploadMusicFile,
    deleteMusicTrack,
    isUploading,
    progress,
    error,
  };
};
