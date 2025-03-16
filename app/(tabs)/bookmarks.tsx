import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const posts = [
  {
    id: '1',
    artistName: 'Artist Name',
    venueName: 'Venue Name',
    genre: 'Genre',
    date: 'Fri, March 28th - 6:30 PM',
    price: 'Price',
  },
  {
    id: '2',
    artistName: 'Artist Name',
    venueName: 'Venue Name',
    genre: 'Genre',
    date: 'Fri, March 28th - 6:30 PM',
    price: 'Price',
  },
  {
    id: '3',
    artistName: 'Artist Name',
    venueName: 'Venue Name',
    genre: 'Genre',
    date: 'Fri, March 28th - 6:30 PM',
    price: 'Price',
  },
];

export default function BookmarksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Saved</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your bookmarks"
          placeholderTextColor="#888"
        />
        <IconSymbol name="settings" size={24} color="#000" style={styles.searchIcon} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <View style={styles.artistInfo}>
                <IconSymbol name="account-circle" size={24} color="#000" />
                <Text style={styles.artistName}>{item.artistName}</Text>
              </View>
              <View style={styles.postActions}>
                <IconSymbol name="share" size={24} color="#000" />
                <IconSymbol name="bookmark" size={24} color="#000" />
              </View>
            </View>
            <Text style={styles.venueName}>{item.venueName}</Text>
            <Text style={styles.genre}>{item.genre}</Text>
            <View style={styles.postImage}>
              <IconSymbol name="image" size={48} color="#888" />
            </View>
            <View style={styles.postFooter}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  postContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
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
  artistName: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueName: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  genre: {
    color: '#888',
  },
  postImage: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    height: 150,
    borderRadius: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    color: '#888',
  },
  price: {
    fontWeight: 'bold',
  },
  flatListContent: {
    paddingBottom: 16,
  },
});
