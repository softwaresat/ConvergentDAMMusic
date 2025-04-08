import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create authentication context
const AuthContext = createContext(null);

// Provider component that wraps the app
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Check if the user is authenticated using AsyncStorage
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for userToken and userData in AsyncStorage
        const userToken = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        
        if (userToken && userDataStr) {
          // User is signed in
          const userData = JSON.parse(userDataStr);
          setUser(userData);
        } else {
          // User is signed out or no data found
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setAuthLoaded(true);
      }
    };

    // Check auth status immediately
    checkAuthStatus();
    
    // Set up listener for auth state changes
    const authStateListener = setInterval(checkAuthStatus, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(authStateListener);
  }, []);

  // Handle navigation based on authentication status
  useEffect(() => {
    if (!authLoaded) return;
    
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && !inAuthGroup) {
      // If not logged in and not on an auth page, redirect to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // If logged in and on an auth page, redirect to home
      router.replace('/');
    }
  }, [user, segments, authLoaded]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook that allows components to access the auth context
export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}

