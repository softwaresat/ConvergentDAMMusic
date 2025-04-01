import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000', // Black background for the bottom bar
          borderTopWidth: 0, // Remove the top border for a cleaner look
        },
        tabBarActiveTintColor: '#fff', // White color for active icons
        tabBarInactiveTintColor: '#888', // Gray color for inactive icons
        headerShown: false, // Hide the header for all screens
      }}
    >
      <Tabs.Screen
        name="index" // Corresponds to app/(tabs)/index.tsx
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="bookmarks" // Corresponds to app/(tabs)/bookmarks.tsx
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" color={color} size={size} />
          ),
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="profile" // Corresponds to app/(tabs)/profile.tsx
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}