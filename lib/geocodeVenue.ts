import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.OPENCAGE_API_KEY;

export const geocodeVenue = async (venueName: string) => {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        venueName
      )}&key=${API_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { latitude: lat, longitude: lng };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
};
