import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import globalStyles from '../styles/globalStyles.js'; // Import global styles
import { useRouter } from 'expo-router'; // Use useRouter from expo-router
import Constants from 'expo-constants';


export default function FilterScreen() {
  const [price, setPrice] = useState(20);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedLocation, setSelectedLocation] = useState('<5 miles');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const router = useRouter(); // Initialize the router

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

  const applyFilters = async () => {
    const queryParams = new URLSearchParams({
      price: price.toString(),
      date: selectedDate,
      location: selectedLocation,
      genres: selectedGenres.join(','),
    }).toString();

    try {
      let response = await fetch(`https://convergentdammusic.onrender.com/concerts?${queryParams}`);
      let concerts = await response.json();
      console.log(concerts);

      // Use router.push to navigate and pass the concerts as a query parameter
      router.push({
        pathname: '/',
        params: { concerts: JSON.stringify(concerts) },
      });
    } catch (error) {
      console.error('Error fetching concerts:', error);
    }
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

      <TouchableOpacity style={globalStyles.applyButton} onPress={applyFilters}>
        <Text style={globalStyles.applyButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}