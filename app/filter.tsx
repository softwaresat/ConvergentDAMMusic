import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import globalStyles from '../styles/globalStyles.js';
import { useRouter } from 'expo-router';
import { useConcerts } from '../hooks/useConcerts';

export default function FilterScreen() {
  const [price, setPrice] = useState(20);
  const [selectedDate, setSelectedDate] = useState('Any');
  const [selectedLocation, setSelectedLocation] = useState('Any');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const router = useRouter();
  const { concerts, loading } = useConcerts();

  // Base genres list with standardized names
  const baseGenres = [
    'Pop', 'Jazz', 'Alternative', 'Country', 'Heavy Metal', 'Rock',
    'Electronic Dance Music', 'R&B', 'Disco', 'Christian', 'K-pop',
    'Folk', 'Blues', 'Indie Rock', 'Swing', 'Rap', 'Hip-Hop', 
    'Classical', 'Punk Rock',
  ];

  // Standardize genre names for comparison
  const standardizeGenre = (genre: string) => {
    // Convert genres to lowercase and remove special characters for comparison
    return genre.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Get standardized genre display name
  const getStandardGenreDisplay = (genre: string) => {
    const standardized = standardizeGenre(genre);
    if (standardized === 'hiphop') {
      return 'Hip-Hop'; // Use this as the standard format for Hip-Hop
    }
    return genre;
  };

  // Add available genres from Firestore concerts with duplicate removal
  const availableGenres = React.useMemo(() => {
    if (!concerts || concerts.length === 0) return baseGenres;

    const allGenres = [...baseGenres];
    
    // Add genres from concerts data
    concerts.forEach(concert => {
      if (concert.genre) {
        allGenres.push(getStandardGenreDisplay(concert.genre));
      }
    });

    // Remove duplicates by standardizing and then using Set
    const uniqueGenres = Array.from(
      new Set(allGenres.map(getStandardGenreDisplay))
    ).sort();
    
    return uniqueGenres;
  }, [concerts]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Set default price to maximum price to include all concerts
  useEffect(() => {
    if (concerts && concerts.length > 0) {
      // Get the maximum price from concerts
      const maxPrice = Math.max(...concerts.map(concert => concert.price));
      // Round up to nearest 10 to ensure we capture all concerts
      setPrice(Math.ceil(maxPrice / 10) * 10);
    }
  }, [concerts]);

  const applyFilters = () => {
    if (!concerts || concerts.length === 0) {
      Alert.alert("Error", "No concert data available");
      return;
    }
    
    console.log("Starting with total concerts:", concerts.length);
    
    // Filter concerts based on user criteria
    let filteredConcerts = [...concerts];

    // Check if we're using default filters - if so, just show all concerts
    const maxPriceFromConcerts = Math.ceil(Math.max(...concerts.map(concert => concert.price)) / 10) * 10;
    const isUsingDefaults = (
      selectedDate === 'Any' && 
      selectedLocation === 'Any' && 
      selectedGenres.length === 0 &&
      price === maxPriceFromConcerts
    );

    if (!isUsingDefaults) {
      // Filter by price
      filteredConcerts = filteredConcerts.filter(concert => 
        concert.price <= price
      );
      
      console.log("After price filter:", filteredConcerts.length);

      // Filter by genre if any genres are selected
      if (selectedGenres.length > 0) {
        filteredConcerts = filteredConcerts.filter(concert => {
          if (!concert.genre) return false;
          // Use standardized comparison for genre matching
          const concertGenreStandardized = standardizeGenre(concert.genre);
          return selectedGenres.some(selectedGenre => 
            standardizeGenre(selectedGenre) === concertGenreStandardized
          );
        });
        console.log("After genre filter:", filteredConcerts.length);
      }

      // Apply date filter - Skip if "Any" is selected
      if (selectedDate !== 'Any') {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const endOfWeek = new Date();
        endOfWeek.setDate(today.getDate() + 7);

        if (selectedDate === 'Today') {
          // For demo purposes, just take 1/3 of concerts as "today"
          filteredConcerts = filteredConcerts.slice(0, Math.ceil(filteredConcerts.length / 3));
          console.log("After 'today' filter:", filteredConcerts.length);
        } else if (selectedDate === 'Tomorrow') {
          // For demo purposes, take middle 1/3 of concerts as "tomorrow"
          const startIdx = Math.ceil(filteredConcerts.length / 3);
          const endIdx = Math.ceil(2 * filteredConcerts.length / 3);
          filteredConcerts = filteredConcerts.slice(startIdx, endIdx);
          console.log("After 'tomorrow' filter:", filteredConcerts.length);
        }
        // "This week" just keeps all concerts
      }
    } else {
      console.log("Using default filters - showing all concerts");
    }
    
    // Apply location filter - Skip if "Any" is selected
    // Note: Currently this doesn't actively filter anything in the demo
    // but will be important when real location data is available

    // Navigate back to home with filtered concerts
    console.log("Final filtered count:", filteredConcerts.length);
    
    // If no concerts match filters, show an alert instead of returning empty results
    if (filteredConcerts.length === 0) {
      Alert.alert(
        "No Results Found",
        "No concerts match your filter criteria. Please try different filters.",
        [
          {
            text: "OK",
            style: "default"
          }
        ]
      );
      return;
    }
    
    // Navigate with filtered concerts
    router.push({
      pathname: '/',
      params: { 
        filtered: 'true',
        concerts: JSON.stringify(filteredConcerts)
      }
    });
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
        {['Any', 'Today', 'Tomorrow', 'This week', 'Custom'].map((date) => (
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
        {['Any', '<5 miles', '<10 miles', '<20 miles', 'Custom'].map((location) => (
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
        {availableGenres.map((genre) => (
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
