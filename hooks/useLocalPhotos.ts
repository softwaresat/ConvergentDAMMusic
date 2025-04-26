import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalPhoto = {
  id: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  concertId: string;
};

/**
 * Hook for managing local photo storage (when Firestore isn't available)
 */
export const useLocalPhotos = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save a photo to local storage
   */
  const saveLocalPhoto = async (photo: LocalPhoto): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the local photos array for this concert
      const localPhotosKey = `local_photos_${photo.concertId}`;
      const existingPhotosJSON = await AsyncStorage.getItem(localPhotosKey) || '[]';
      const existingPhotos: LocalPhoto[] = JSON.parse(existingPhotosJSON);
      
      // Add the new photo
      existingPhotos.push(photo);
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem(localPhotosKey, JSON.stringify(existingPhotos));
      
      console.log('Saved photo to local storage:', photo.id);
      return true;
    } catch (err) {
      console.error('Failed to save photo to local storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to save photo locally');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all photos for a concert from local storage
   */
  const getLocalPhotos = async (concertId: string): Promise<LocalPhoto[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the local photos array for this concert
      const localPhotosKey = `local_photos_${concertId}`;
      const photosJSON = await AsyncStorage.getItem(localPhotosKey) || '[]';
      return JSON.parse(photosJSON);
    } catch (err) {
      console.error('Failed to get photos from local storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to get photos from local storage');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a photo from local storage
   */
  const deleteLocalPhoto = async (concertId: string, photoId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the local photos array for this concert
      const localPhotosKey = `local_photos_${concertId}`;
      const existingPhotosJSON = await AsyncStorage.getItem(localPhotosKey) || '[]';
      const existingPhotos: LocalPhoto[] = JSON.parse(existingPhotosJSON);
      
      // Filter out the photo to delete
      const updatedPhotos = existingPhotos.filter(photo => photo.id !== photoId);
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem(localPhotosKey, JSON.stringify(updatedPhotos));
      
      return true;
    } catch (err) {
      console.error('Failed to delete photo from local storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete photo from local storage');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveLocalPhoto,
    getLocalPhotos,
    deleteLocalPhoto,
    isLoading,
    error,
  };
};