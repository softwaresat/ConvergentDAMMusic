// app/genres.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import globalStyles from '../../styles/globalStyles';

const genres = [
  'Pop', 'Jazz', 'Rock', 'Hip-Hop', 'Classical',
  'EDM', 'Country', 'R&B', 'Folk', 'Blues',
  'K-pop', 'Metal', 'Indie', 'Reggae', 'Disco'
];

const GenreScreen = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const router = useRouter();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const renderItem = ({ item }: { item: string }) => {
    const selected = selectedGenres.includes(item);
    return (
        <TouchableOpacity
        style={[
          globalStyles.genreTile,
          selected ? globalStyles.selectedGenreTile : null,
        ]}
        onPress={() => toggleGenre(item)}
      >      
        <Text
            style={[
                globalStyles.genreText,
                selected ? globalStyles.selectedGenreText : null,
            ]}
            >
            {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={globalStyles.genreTitle}>Select Genres</Text>
      <FlatList
        data={genres}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={globalStyles.genreGrid}
      />
    </SafeAreaView>
  );
};

export default GenreScreen;
