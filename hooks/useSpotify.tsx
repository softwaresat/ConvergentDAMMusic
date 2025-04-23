// @ts-nocheck
import { useState, useEffect } from 'react';
import { Alert, Keyboard, Linking, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
// Import the predefined genres list from genres_poll.tsx
import { genres as appGenres } from '../app/(tabs)/genres_poll';

// Configure PKCE OAuth endpoints for Spotify
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

// Your Spotify app client ID - this only needs to be provided to open the Spotify authorization page
const CLIENT_ID = '0f194256c0834bc2b594e08913546d93';

// Popular genre lists by category for recommendations
const GENRE_CATEGORIES = {
  pop: ['Pop', 'Synth Pop', 'Dance Pop', 'Electropop', 'K-Pop', 'Adult Contemporary'],
  rock: ['Rock', 'Alternative Rock', 'Indie Rock', 'Classic Rock', 'Hard Rock', 'Progressive Rock'],
  electronic: ['Electronic', 'House', 'Techno', 'EDM', 'Dubstep', 'Drum and Bass', 'Ambient'],
  hipHop: ['Hip Hop', 'Rap', 'Trap', 'R&B', 'Neo Soul', 'Grime'],
  jazz: ['Jazz', 'Bebop', 'Fusion', 'Smooth Jazz', 'Swing'],
  classical: ['Classical', 'Symphony', 'Opera', 'Chamber Music', 'Baroque'],
  country: ['Country', 'Folk', 'Americana', 'Bluegrass', 'Country Pop'],
  latin: ['Latin', 'Reggaeton', 'Salsa', 'Bachata', 'Cumbia', 'Bossa Nova'],
  metal: ['Metal', 'Heavy Metal', 'Death Metal', 'Black Metal', 'Thrash Metal', 'Nu Metal'],
  other: ['Blues', 'Funk', 'Disco', 'Punk', 'Reggae', 'Soul', 'World'],
};

export const useSpotify = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build a PKCE auth request with consistent redirectUri
  const redirectUri = AuthSession.makeRedirectUri({ 
    useProxy: true,
    // Set scheme if needed for native redirects
    scheme: 'convergentdammusic' 
  });

  
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['user-top-read'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  // Exchange authorization code for access token
  useEffect(() => {
    console.log("[useSpotify] Auth response received:", response);
    if (response?.type === 'success' && response.params.code) {
      (async () => {
        console.log("[useSpotify] Valid auth code received, exchanging for token...");
        setLoading(true);
        try {
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId: CLIENT_ID, // Make sure to pass the same client ID
              code: response.params.code,
              redirectUri, // Use the same redirectUri here
              extraParams: { 
                code_verifier: request?.codeVerifier ?? '',
                // Add client_id again for some implementations
                client_id: CLIENT_ID 
              },
            },
            discovery
          );
          console.log("[useSpotify] Access token successfully received!");
          await saveToken(tokenResult.accessToken);
          setToken(tokenResult.accessToken);
        } catch (err: any) {
          console.error("[useSpotify] Token exchange failed:", err);
          console.error("[useSpotify] Error details:", JSON.stringify(err, null, 2));
          setError(err.message);
        } finally {
          setLoading(false);
        }
      })();
    } else if (response?.type === 'error') {
      console.error("[useSpotify] Auth response error:", response.error);
    }
  }, [response]);

  const loadToken = async (): Promise<string | null> => {
    try {
      const raw = await SecureStore.getItemAsync('spotifyToken');
      if (!raw) return null;
      
      // Parse the token data
      const tokenData = JSON.parse(raw);
      const { access_token, expirationTime } = tokenData;
      
      // Check if token is expired
      if (new Date(expirationTime) > new Date()) {
        setToken(access_token);
        return access_token;
      } else {
        // Token is expired, delete it
        console.log("[useSpotify] Token expired, removing from secure storage");
        await SecureStore.deleteItemAsync('spotifyToken');
        setToken(null);
      }
      return null;
    } catch (err) {
      console.error("[useSpotify] Error loading token:", err);
      return null;
    }
  };

  const saveToken = async (access_token: string) => {
    try {
      // 1-hour expiry (Spotify’s default for implicit-grant)
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
  
      await SecureStore.setItemAsync(
        'spotifyToken',
        JSON.stringify({
          access_token,
          expirationTime: expires.toISOString(),
        })
      );
  
      setToken(access_token);   // keep state in sync
    } catch (err) {
      console.error('[useSpotify] error saving token:', err);
    }
  };

  const login = async () => {
    setLoading(true);
    setError(null);
    console.log("[useSpotify] Starting login process...");
    
    // Return existing valid token if present
    const existing = await loadToken();
    if (existing) {
      console.log("[useSpotify] Found existing valid token, skipping auth");
      setLoading(false);
      return existing;
    }
    
    console.log("[useSpotify] No existing token, triggering PKCE flow with redirectUri:", redirectUri);
    // Trigger PKCE flow
    const result = await promptAsync({ useProxy: true });
    console.log("[useSpotify] Auth prompt completed with result:", result);
    
    if (result.type !== 'success') {
      setLoading(false);
      console.error("[useSpotify] Authentication failed or was cancelled");
      throw new Error('Spotify authentication cancelled or failed');
    }

    console.log("[useSpotify] Waiting for token exchange process to complete...");
    // We need to wait for the response useEffect to get and save the token
    // Add a reasonable timeout with polling
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    
    while (attempts < maxAttempts) {
      attempts++;
      const newToken = await loadToken();
      if (newToken) {
        console.log("[useSpotify] Token successfully retrieved after code exchange");
        setLoading(false);
        return newToken;
      }
      console.log("[useSpotify] Waiting for token... (attempt", attempts, "of", maxAttempts, ")");
      // Wait 1 second between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setLoading(false);
    console.error("[useSpotify] Timed out waiting for token after auth");
    throw new Error('Failed to retrieve Spotify token');
  };

  // Fetch user's top genres from Spotify
  const fetchTopGenres = async (accessToken: string) => {
    console.log("[useSpotify] Fetching top genres with token:", accessToken.substring(0, 5) + '...');
    console.log("[useSpotify] Will match with app genres:", appGenres);
    
    try {
      // Validate token first with a simple profile request
      const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!profileResponse.ok) {
        console.error("[useSpotify] Token validation failed:", profileResponse.status);
        
        if (profileResponse.status === 401) {
          // Token is invalid/expired, clear it and force re-authentication
          await SecureStore.deleteItemAsync('spotifyToken');
          setToken(null);
          
          console.log("[useSpotify] Invalid token detected - initiating fresh authentication");
          // Get fresh token
          const newToken = await login();
          if (!newToken) {
            throw new Error("Failed to obtain a valid token");
          }
          accessToken = newToken; // Use the fresh token
        } else {
          throw new Error(`Spotify API error: ${profileResponse.status}`);
        }
      }
      
      // Now proceed with fetching top artists with the validated token
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response from Spotify API');
      }
      
      // Extract all genres from all artists
      const allSpotifyGenres = [];
      data.items.forEach(artist => {
        if (artist.genres && Array.isArray(artist.genres)) {
          allSpotifyGenres.push(...artist.genres);
        }
      });
      
      console.log("[useSpotify] Raw Spotify genres:", allSpotifyGenres);
      
      if (allSpotifyGenres.length === 0) {
        console.log("[useSpotify] No Spotify genres found, returning defaults");
        // If no genres found, return up to 3 default genres that exist in our app
        const defaultGenres = ['Pop', 'Rock', 'Electronic'].filter(g => 
          appGenres.includes(g)
        );
        return defaultGenres.length > 0 ? defaultGenres : [appGenres[0]];
      }
      
      // Create a map to track matches for each app genre
      const genreMatches = {};
      
      // For each app genre, check how many Spotify genres match it
      appGenres.forEach(appGenre => {
        const normalizedAppGenre = appGenre.toLowerCase().replace('-', ' ');
        let matchCount = 0;
        
        allSpotifyGenres.forEach(spotifyGenre => {
          const normalizedSpotifyGenre = spotifyGenre.toLowerCase();
          
          // Check for direct match or contained match
          if (
            normalizedSpotifyGenre === normalizedAppGenre ||
            normalizedSpotifyGenre.includes(normalizedAppGenre) ||
            normalizedAppGenre.includes(normalizedSpotifyGenre)
          ) {
            matchCount++;
          }
          
          // Special case mappings
          if (
            (normalizedAppGenre === 'hip-hop' && 
              (normalizedSpotifyGenre.includes('rap') || normalizedSpotifyGenre.includes('hip hop'))) ||
            (normalizedAppGenre === 'edm' && 
              (normalizedSpotifyGenre.includes('electronic') || normalizedSpotifyGenre.includes('house') || 
               normalizedSpotifyGenre.includes('techno') || normalizedSpotifyGenre.includes('dance'))) ||
            (normalizedAppGenre === 'k-pop' && normalizedSpotifyGenre.includes('k-pop')) ||
            (normalizedAppGenre === 'r&b' && 
              (normalizedSpotifyGenre.includes('r&b') || normalizedSpotifyGenre.includes('soul')))
          ) {
            matchCount++;
          }
        });
        
        if (matchCount > 0) {
          genreMatches[appGenre] = matchCount;
        }
      });
      
      console.log("[useSpotify] Genre matches:", genreMatches);
      
      // Sort app genres by match count and take top 5
      const matchedAppGenres = Object.entries(genreMatches)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre);
      
      if (matchedAppGenres.length === 0) {
        console.log("[useSpotify] No matches found, returning first app genre");
        // If no matches were found, return the first app genre
        return [appGenres[0]];
      }
      
      console.log("[useSpotify] Final matched genres:", matchedAppGenres);
      return matchedAppGenres;
    } catch (err) {
      console.error('[useSpotify] Error fetching top genres:', err);
      throw err;
    }
  };

  // Fetch user's top tracks from Spotify
  const fetchTopTracks = async (limit = 20, timeRange = 'medium_term') => {
    try {
      // Make sure we have a valid token
      const accessToken = token || await loadToken();
      if (!accessToken) {
        throw new Error('No valid Spotify token available');
      }
      
      // Fetch user's top tracks
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`, 
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response from Spotify API');
      }
      
      // Extract the relevant track information
      return data.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[0]?.url || null,
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        uri: track.uri
      }));
    } catch (err) {
      console.error('Error fetching top tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch top tracks');
      return [];
    }
  };

  // Get personalized track recommendations based on seed tracks and genres
  const fetchRecommendations = async (options = {}) => {
    try {
      const accessToken = token || await loadToken();
      if (!accessToken) {
        throw new Error('No valid Spotify token available');
      }

      // Default options
      const defaultOptions = {
        limit: 20,
        seedTracks: [], // Array of Spotify track IDs
        seedArtists: [], // Array of Spotify artist IDs
        seedGenres: [], // Array of genre names
        minEnergy: 0.4,
        minDanceability: 0.4
      };

      // Merge default and provided options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', mergedOptions.limit.toString());
      
      // Add seed tracks (max 5 total seeds)
      const totalSeeds = 
        Math.min(5, 
          (mergedOptions.seedTracks?.length || 0) + 
          (mergedOptions.seedArtists?.length || 0) + 
          (mergedOptions.seedGenres?.length || 0)
        );
        
      // Prioritize tracks, then artists, then genres
      let remainingSeeds = totalSeeds;
      
      if (mergedOptions.seedTracks?.length) {
        const tracksToUse = mergedOptions.seedTracks.slice(0, remainingSeeds);
        params.append('seed_tracks', tracksToUse.join(','));
        remainingSeeds -= tracksToUse.length;
      }
      
      if (remainingSeeds > 0 && mergedOptions.seedArtists?.length) {
        const artistsToUse = mergedOptions.seedArtists.slice(0, remainingSeeds);
        params.append('seed_artists', artistsToUse.join(','));
        remainingSeeds -= artistsToUse.length;
      }
      
      if (remainingSeeds > 0 && mergedOptions.seedGenres?.length) {
        const genresToUse = mergedOptions.seedGenres.slice(0, remainingSeeds);
        params.append('seed_genres', genresToUse.join(','));
      }
      
      // Add audio features parameters
      if (mergedOptions.minEnergy !== undefined) {
        params.append('min_energy', mergedOptions.minEnergy.toString());
      }
      
      if (mergedOptions.minDanceability !== undefined) {
        params.append('min_danceability', mergedOptions.minDanceability.toString());
      }

      // Make request
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the relevant track information
      return data.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[0]?.url || null,
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        uri: track.uri
      }));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      return [];
    }
  };

  // Play a track via Spotify (opens Spotify app on mobile, uses web player on web)
  const playTrack = async (trackUri) => {
    try {
      // On mobile, deep link to Spotify app
      if (Platform.OS !== 'web') {
        const spotifyUrl = `spotify:track:${trackUri.split(':')[2]}`;
        const canOpen = await Linking.canOpenURL(spotifyUrl);
        
        if (canOpen) {
          await Linking.openURL(spotifyUrl);
          return true;
        } else {
          // If Spotify app isn't installed, open in web browser
          await Linking.openURL(`https://open.spotify.com/track/${trackUri.split(':')[2]}`);
          return true;
        }
      } 
      // On web, try to use Spotify Web Playback SDK
      else {
        // NOTE: Web playback requires Spotify Premium and additional SDK setup
        // This is a placeholder for web implementation
        window.open(`https://open.spotify.com/track/${trackUri.split(':')[2]}`, '_blank');
        return true;
      }
    } catch (err) {
      console.error('Error playing track:', err);
      setError(err instanceof Error ? err.message : 'Failed to play track');
      return false;
    }
  };

  // Logout from Spotify
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('spotifyToken');
      setToken(null); // clear token state instead of saveToken(null)
    } catch (e) {
      console.error('Error during logout:', e);
    }
  };

  return {
    token,
    loading,
    error,
    login,
    logout,
    fetchTopGenres,
    fetchTopTracks,
    fetchRecommendations,
    playTrack,
  };
};