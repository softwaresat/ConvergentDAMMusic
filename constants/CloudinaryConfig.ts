// Cloudinary configuration settings
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmpxaxhd9',
  UPLOAD_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'convergent_app',
  API_KEY: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  API_SECRET: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET,
};

// Base URL for Cloudinary API
export const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}`;