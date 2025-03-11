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
  );
}

const styles = StyleSheet.create({
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
  },
});
