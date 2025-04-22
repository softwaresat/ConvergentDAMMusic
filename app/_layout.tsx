import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ReactNode } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

type AuthContextType = {
  user: any;
  setUser: (user: any) => void;
};

// Create authentication context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component that wraps the app
function AuthProvider({ children }: { children: ReactNode }) {
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
        const fromSignup = await AsyncStorage.getItem('fromSignup');
        
        if (userToken && userDataStr) {
          // User is signed in
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          
          // If we're coming from signup, don't need to check anything else
          if (fromSignup === 'true') {
            return;
          }
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
    // Use a longer interval to reduce unnecessary checks
    const authStateListener = setInterval(checkAuthStatus, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(authStateListener);
  }, []);

  // Handle navigation based on authentication status
  useEffect(() => {
    if (!authLoaded) return;
    
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    const checkAuthNavigation = async () => {
      try {
        // Check if user is coming from signup process
        const fromSignup = await AsyncStorage.getItem('fromSignup');
        
        if (user) {
          // User is authenticated
          if (inAuthGroup) {
            // User is authenticated but on an auth page
            if (fromSignup === 'true') {
              // Coming from signup - go directly to genres_poll
              console.log("Redirecting from signup to genres_poll");
              router.replace('/(tabs)/genres_poll');
            } else {
              // Regular login - go to home
              router.replace('/');
            }
          }
          // If user is authenticated and not on auth page, no redirect needed
        } else {
          // User is not authenticated
          if (!inAuthGroup) {
            // Not logged in and not on an auth page, redirect to login
            router.replace('/login');
          }
          // If not authenticated and on auth page, no redirect needed
        }
      } catch (error) {
        console.error('Auth navigation error:', error);
      }
    };

    checkAuthNavigation();
  }, [user, segments, authLoaded]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook that allows components to access the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

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
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          animationDuration: 300,
          presentation: 'card',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="filter" />
      </Stack>
    </AuthProvider>
  );
}

