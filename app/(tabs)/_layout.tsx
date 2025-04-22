// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      // Use our custom tab bar component
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarStyle: {
          // The custom tab bar handles styling now
          display: 'none',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" color={color} size={size} />
          ),
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
          title: 'Profile',
        }}
      />
      {/* Hide genres_poll from the tab bar */}
      <Tabs.Screen
        name="genres_poll"
        options={{
          tabBarButton: () => null, // Remove the button completely
          tabBarStyle: { display: 'none' }, // Hide tab bar on this screen
        }}
      />
    </Tabs>
  );
}
