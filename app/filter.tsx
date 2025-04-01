import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import globalStyles from '../styles/globalStyles.js'; // Import global styles

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
    <ScrollView style={globalStyles.filterContainer}>
      <Text style={globalStyles.sectionTitle}>Price</Text>
      <Text style={globalStyles.priceText}>$0 - ${price}</Text>
      <Slider
        style={globalStyles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={price}
        onValueChange={(value) => setPrice(value)}
        minimumTrackTintColor="#FF0000"
        maximumTrackTintColor="#000000"
        thumbTintColor="#FF0000"
      />

      <Text style={globalStyles.sectionTitle}>Date</Text>
      <View style={globalStyles.optionsContainer}>
        {['Today', 'Tomorrow', 'This week', 'Custom'].map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              globalStyles.optionButton,
              selectedDate === date && globalStyles.selectedOption,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text
              style={[
                globalStyles.optionText,
                selectedDate === date && globalStyles.selectedOptionText,
              ]}
            >
              {date}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={globalStyles.sectionTitle}>Location</Text>
      <View style={globalStyles.optionsContainer}>
        {['<5 miles', '<10 miles', '<20 miles', 'Custom'].map((location) => (
          <TouchableOpacity
            key={location}
            style={[
              globalStyles.optionButton,
              selectedLocation === location && globalStyles.selectedOption,
            ]}
            onPress={() => setSelectedLocation(location)}
          >
            <Text
              style={[
                globalStyles.optionText,
                selectedLocation === location && globalStyles.selectedOptionText,
              ]}
            >
              {location}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={globalStyles.sectionTitle}>Music Genre</Text>
      <View style={globalStyles.optionsContainer}>
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              globalStyles.optionButton,
              selectedGenres.includes(genre) && globalStyles.selectedOption,
            ]}
            onPress={() => toggleGenre(genre)}
          >
            <Text
              style={[
                globalStyles.optionText,
                selectedGenres.includes(genre) && globalStyles.selectedOptionText,
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