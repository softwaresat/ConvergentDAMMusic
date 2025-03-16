import React from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

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
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <IconSymbol name="account-circle" size={100} color="#808080" />
          <Text style={styles.name}>Name</Text>
          <IconSymbol name="menu" size={24} color="#000" style={styles.menuIcon} />
        </View>
        <Text style={styles.sectionTitle}>Concerts Attended</Text>
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
          // Ensure the FlatList is scrollable within the ScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.flatListContent}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  menuIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 16,
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
