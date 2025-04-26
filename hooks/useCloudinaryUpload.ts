import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { CLOUDINARY_CONFIG, CLOUDINARY_URL } from '../constants/CloudinaryConfig';
import { auth } from './firebase';

export type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
};

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload an image to Cloudinary
   */
  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      // Create form data
      const formData = new FormData();
      
      // Convert the image uri to a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Add the image to the form
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg', // Adjust based on your image type
        name: `photo_${Date.now()}.jpg`
      } as any);
      
      formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
      formData.append('timestamp', (Date.now() / 1000).toString());
      formData.append('api_key', CLOUDINARY_CONFIG.API_KEY || '');
      
      // Upload to Cloudinary
      const uploadResponse = await fetch(
        `${CLOUDINARY_URL}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Simulate progress (for better UX, as direct Cloudinary upload doesn't expose progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const responseData = await uploadResponse.json();
      clearInterval(progressInterval);
      
      if (uploadResponse.ok) {
        setProgress(100);
        return responseData.secure_url;
      } else {
        throw new Error(responseData.error?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading to Cloudinary:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle concert photo upload
   */
  const uploadConcertPhoto = async (concertId: string): Promise<boolean> => {
    try {
      // Request camera roll permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return false;
      }
      
      // Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (result.canceled) return false;
      
      const image = result.assets[0];
      setIsUploading(true);
      
      // Get user data
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : {};
      const displayName = userData.displayName || 'Anonymous User';
      const userId = auth.currentUser?.uid || 'anonymous';
      
      // Upload to Cloudinary
      const imageUrl = await uploadImage(image.uri);
      
      if (!imageUrl) {
        throw new Error('Failed to get image URL from Cloudinary');
      }
      
      // Save photo metadata to Firestore
      const photoData = {
        concertId,
        imageUrl,
        uploadedBy: userId,
        uploadedByName: displayName,
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'concertPhotos'), photoData);
      return true;
      
    } catch (err) {
      console.error('Error uploading concert photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload concert photo');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadConcertPhoto,
    isUploading,
    progress,
    error,
  };
};