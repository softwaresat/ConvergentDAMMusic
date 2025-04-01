import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useNavigation } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Main tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Event detail screen */}
      <Stack.Screen
        name="event/[id]"
        options={{
          title: 'Event Details',
          headerTransparent: true,
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerLeft: () => {
            const navigation = useNavigation();
            return (
              <Pressable onPress={() => navigation.goBack()} style={{ paddingHorizontal: 12 }}>
                <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
              </Pressable>
            );
          },
        }}
      />
    </Stack>
  );
}
