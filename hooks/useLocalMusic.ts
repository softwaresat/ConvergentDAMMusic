import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';

// Map of artist names to their local music files
// This could be expanded to include more artists and tracks
const artistToMusicMap: Record<string, string> = {
  'CorMae': require('../assets/music/CorMae.mp3'),
  'Evania': require('../assets/music/Evania.mp3'),
  'Fifi Knifefight': require('../assets/music/fifi knifefight.mp3'),
  'Social Dissonance': require('../assets/music/Social Dissonance.mp3'),
};

/**
 * Gets a mapping of all artists with local music files
 */
export const getLocalMusicArtists = (): string[] => {
  return Object.keys(artistToMusicMap);
};

/**
 * Check if an artist has a local music file
 */
export const hasLocalMusicFile = (artistName: string): boolean => {
  // Try to find a matching artist name (case-insensitive)
  const normalizedArtistName = artistName.toLowerCase().trim();
  return Object.keys(artistToMusicMap).some(
    artist => artist.toLowerCase().trim() === normalizedArtistName
  );
};

/**
 * Get the URI for a local music file by artist name
 * Returns undefined if no matching file is found
 */
export const getLocalMusicFileUri = (artistName: string): string | undefined => {
  const normalizedArtistName = artistName.toLowerCase().trim();
  
  // Find a matching artist name (case-insensitive)
  const matchingArtist = Object.keys(artistToMusicMap).find(
    artist => artist.toLowerCase().trim() === normalizedArtistName
  );

  if (!matchingArtist) return undefined;

  // Return the local file require reference
  return artistToMusicMap[matchingArtist];
};

/**
 * Create a playable URI from a local music file
 */
export const loadLocalMusicFile = async (artistName: string): Promise<string | undefined> => {
  try {
    const fileRequire = getLocalMusicFileUri(artistName);
    if (!fileRequire) return undefined;

    // Load the asset
    const asset = Asset.fromModule(fileRequire);
    await asset.downloadAsync();

    // Return the local URI which can be used by the Audio API
    return asset.localUri || asset.uri;
  } catch (error) {
    console.error('Error loading local music file:', error);
    return undefined;
  }
};