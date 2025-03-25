import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';

export default function FilterScreen() {
  const [price, setPrice] = useState(20);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedLocation, setSelectedLocation] = useState('<5 miles');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const genres = [
    'Pop', 'Jazz', 'Alternative', 'Country', 'Heavy Metal', 'Rock',
    'Electronic Dance Music', 'R&B', 'Disco', 'Christian', 'K-pop',
    'Folk', 'Blues', 'Indie Rock', 'Swing', 'Rap', 'Hip-Hop', 'Ska',
    'Classical', 'Punk Rock',
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Price</Text>
      <Text style={styles.priceText}>$0 - ${price}</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={price}
        onValueChange={(value) => setPrice(value)}
        minimumTrackTintColor="#FF0000"
        maximumTrackTintColor="#000000"
        thumbTintColor="#FF0000"
      />

      <Text style={styles.sectionTitle}>Date</Text>
      <View style={styles.optionsContainer}>
        {['Today', 'Tomorrow', 'This week', 'Custom'].map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.optionButton,
              selectedDate === date && styles.selectedOption,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text
              style={[
                styles.optionText,
                selectedDate === date && styles.selectedOptionText,
              ]}
            >
              {date}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.optionsContainer}>
        {['<5 miles', '<10 miles', '<20 miles', 'Custom'].map((location) => (
          <TouchableOpacity
            key={location}
            style={[
              styles.optionButton,
              selectedLocation === location && styles.selectedOption,
            ]}
            onPress={() => setSelectedLocation(location)}
          >
            <Text
              style={[
                styles.optionText,
                selectedLocation === location && styles.selectedOptionText,
              ]}
            >
              {location}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Music Genre</Text>
      <View style={styles.optionsContainer}>
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.optionButton,
              selectedGenres.includes(genre) && styles.selectedOption,
            ]}
            onPress={() => toggleGenre(genre)}
          >
            <Text
              style={[
                styles.optionText,
                selectedGenres.includes(genre) && styles.selectedOptionText,
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Set to black for better contrast
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // White text for dark background
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    color: '#fff', // White text for dark background
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4, // Use margin for spacing between buttons
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedOption: {
    backgroundColor: '#fff',
  },
  selectedOptionText: {
    color: '#000',
  },
});