<<<<<<< HEAD
import React from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

const posts = [
  {
    id: '1',
    artistName: 'Artist Name',
    time: '5 mins ago',
    caption: 'Caption text caption text caption text caption text caption text caption text caption text caption text caption text...',
    likes: 300,
  },
  {
    id: '2',
    artistName: 'Artist Name',
    time: '5 mins ago',
    caption: 'Caption text caption text caption text caption text caption text caption text caption text caption text caption text...',
    likes: 300,
  },
];

export default function HomeScreen() {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerText}>For You</Text>
          <Text style={styles.headerText}>Following</Text>
          <Text style={styles.headerText}>Suggested</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ThemedView style={styles.postContainer}>
          <View style={styles.postHeader}>
            <View style={styles.artistInfo}>
              <View style={styles.artistAvatar} />
              <Text style={styles.artistName}>{item.artistName}</Text>
              <IconSymbol name="music.note" size={16} color="#000" />
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.suggested}>Suggested</Text>
          </View>
          <Text style={styles.caption}>{item.caption}</Text>
          <View style={styles.postImage} />
          <View style={styles.postActions}>
            <Text style={styles.likes}>{item.likes}</Text>
            <IconSymbol name="heart" size={24} color="#000" />
            <IconSymbol name="comment" size={24} color="#000" />
            <IconSymbol name="send" size={24} color="#000" />
            <IconSymbol name="bookmark" size={24} color="#000" />
          </View>
        </ThemedView>
      )}
    />
=======
import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
>>>>>>> afbad03 (og commit)
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  headerText: {
    fontWeight: 'bold',
  },
  postContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  artistName: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  time: {
    color: '#888',
  },
  suggested: {
    color: '#888',
  },
  caption: {
    marginVertical: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likes: {
    marginRight: 5,
=======
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
>>>>>>> afbad03 (og commit)
  },
});
