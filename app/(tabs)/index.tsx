import React, { useEffect, useState, useMemo } from 'react';
import { Image, TouchableOpacity, ImageBackground, ScrollView, RefreshControl } from 'react-native';
import { View, Text, StyleSheet, Dimensions, FlatList, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import globalStyles from '../../styles/globalStyles';
import { ThemedView } from '../../components/ThemedView';
import { useConcerts } from '../../hooks/useConcerts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// A component for the concert recommendation carousel
const RecommendationCarousel = ({ title, concerts, router }) => {
  if (!concerts || concerts.length === 0) {
    return null;
  }

  return (
    <View style={globalStyles.carouselContainer}>
      <Text style={globalStyles.carouselTitle}>{title}</Text>
      <FlatList
        horizontal
        data={concerts}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={globalStyles.carouselList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={globalStyles.carouselItem}
            onPress={() => router.push(`/event/${item.id}`)}
          >
            <ImageBackground 
              source={{ uri: item.imageUrl }} 
              style={globalStyles.carouselImage}
            >
              <View style={globalStyles.carouselOverlay}>
                <Text style={globalStyles.carouselArtistName}>
                  {item.artistName}
                </Text>
                <View style={globalStyles.carouselVenueRow}>
                  <MaterialIcons name="location-on" size={14} color="white" />
                  <Text style={globalStyles.carouselVenueName}>
                    {item.venueName}
                  </Text>
                </View>
                <View style={globalStyles.carouselGenreRow}>
                  <MaterialIcons name="music-note" size={14} color="white" />
                  <Text style={globalStyles.carouselGenre}>
                    {item.genre} • {item.date}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { concerts: allConcerts, loading, error, refreshConcerts } = useConcerts();
  
  // State for filtered concerts
  const [concerts, setConcerts] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const [userGenreRecommendations, setUserGenreRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Force refresh function that clears cache
  const forceRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear the concerts cache
      await AsyncStorage.removeItem('cached_concerts');
      await AsyncStorage.removeItem('last_concerts_fetch_time');
      console.log('Cleared concerts cache');
      
      // Force refresh from Firebase
      await refreshConcerts();
      
      Alert.alert(
        "Data Refreshed", 
        "The concert data has been refreshed from the database.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error during force refresh:', error);
      Alert.alert(
        "Refresh Failed", 
        "There was a problem refreshing the data. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Load user's favorite genres
  useEffect(() => {
    const loadUserGenres = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData.favoriteGenres && parsedUserData.favoriteGenres.length > 0) {
            setUserGenres(parsedUserData.favoriteGenres);
          }
        }
      } catch (error) {
        console.error('Error loading user genres:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadUserGenres();
  }, []);
  
  // Apply filters from URL if present - Fixed by using stringified searchParams as a dependency
  useEffect(() => {
    if (!allConcerts || allConcerts.length === 0) {
      return;
    }
    
    if (searchParams.concerts && searchParams.filtered === 'true') {
      try {
        // If we have filtered concerts from the filter page, use those
        const filteredConcerts = JSON.parse(String(searchParams.concerts));
        setConcerts(filteredConcerts);
        setIsFiltered(true);
      } catch (e) {
        console.error("Error parsing filtered concerts:", e);
        setConcerts(allConcerts);
        setIsFiltered(false);
      }
    } else {
      // Otherwise use all concerts
      setConcerts(allConcerts);
      setIsFiltered(false);
    }
  }, [
    // Using stable dependencies to prevent infinite loops
    allConcerts,
    // Convert searchParams to strings to create stable dependencies
    String(searchParams.concerts),
    String(searchParams.filtered)
  ]);
  
  // Generate recommendations based on user's favorite genres
  useEffect(() => {
    if (userGenres.length > 0 && allConcerts && allConcerts.length > 0) {
      // Standardize genres for comparison
      const standardizeGenre = (genre) => {
        return genre.toLowerCase().replace(/[^a-z0-9]/g, '');
      };
      
      // Find concerts matching user's favorite genres
      const userRecommendations = allConcerts.filter(concert => {
        if (!concert.genre) return false;
        const concertGenreStandardized = standardizeGenre(concert.genre);
        
        // Check if any user genre matches this concert's genre
        return userGenres.some(userGenre => {
          const userGenreStandardized = standardizeGenre(userGenre);
          // Partial matching for better recommendations
          return concertGenreStandardized.includes(userGenreStandardized) || 
                 userGenreStandardized.includes(concertGenreStandardized);
        });
      });
      
      if (userRecommendations.length > 0) {
        // Shuffle recommendations for variety
        const shuffledRecommendations = [...userRecommendations].sort(() => 0.5 - Math.random());
        setUserGenreRecommendations(shuffledRecommendations.slice(0, 10)); // Limit to top 10
      } else {
        // If no exact matches found, show general recommendations
        setUserGenreRecommendations(allConcerts.slice(0, 10).sort(() => 0.5 - Math.random()));
      }
    }
  }, [userGenres, allConcerts]);
  
  // Trending recommendation (random selection)
  const trendingConcerts = useMemo(() => {
    if (concerts.length === 0) return [];
    
    // Shuffle the concerts array and take the first 5
    const shuffled = [...concerts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, [concerts]);

  const clearFilters = () => {
    router.push({
      pathname: '/',
      params: {}
    });
  };

  // Format price with dollar sign
  const formatPrice = (price) => {
    if (price === 0) return 'FREE';
    return `$${price}`;
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Search and Filter Bar */}
      <View style={globalStyles.searchBar}>
        <MaterialIcons name="search" size={20} color="#888" style={globalStyles.searchIcon} />
        <TextInput
          style={globalStyles.searchInput}
          placeholder="Find performances"
          placeholderTextColor="#888"
        />

        <TouchableOpacity onPress={() => router.push('/filter')}>
          <MaterialIcons name="tune" size={20} color="#888" style={globalStyles.filterIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={forceRefresh}
            colors={["#ff585d"]}
            tintColor={"#ff585d"}
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={globalStyles.carouselTitle}>
            {isFiltered ? "Filtered Concerts" : "All Concerts"}
          </Text>
          
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={forceRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="refresh" size={16} color="#fff" />
                <Text style={styles.refreshText}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {isFiltered && (
          <View style={globalStyles.filteredInfo}>
            <Text style={globalStyles.filteredText}>Showing {concerts.length} filtered concerts</Text>
            <TouchableOpacity onPress={clearFilters} style={globalStyles.clearFiltersButton}>
              <Text style={globalStyles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Only show these sections when not filtered */}
        {!isFiltered && (
          <>
            {/* User's Genre Recommendations - only shown if user has selected genres */}
            {userGenres.length > 0 && userGenreRecommendations.length > 0 && (
              <RecommendationCarousel 
                title="Recommended For You"
                concerts={userGenreRecommendations}
                router={router}
              />
            )}
            
            {/* Trending Recommendations Carousel */}
            <RecommendationCarousel 
              title="Trending Concerts"
              concerts={trendingConcerts}
              router={router}
            />
          </>
        )}
        
        {/* Concert List */}
        {concerts.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              router.push(`/event/${item.id}`);
            }}
          >
            <ThemedView style={globalStyles.postContainer}>
              <ImageBackground source={{ uri: item.imageUrl }} style={globalStyles.posterImage}>
                <View style={globalStyles.overlay}>
                  {/* Artist Row */}
                  <View style={globalStyles.artistRow}>
                    <View style={globalStyles.artistInfo}>
                      <MaterialIcons name="account-circle" size={20} color="white" />
                      <Text style={globalStyles.artistName}>{item.artistName}</Text>
                    </View>
                    <View style={globalStyles.actions}>
                      <MaterialIcons name="share" size={20} color="white" style={globalStyles.iconSpacing} />
                      <MaterialIcons name="bookmark-outline" size={20} color="white" />
                    </View>
                  </View>

                  {/* Venue & Genre Info (Below Artist) */}
                  <View style={globalStyles.infoRow}>
                    <MaterialIcons name="location-on" size={20} color="white" />
                    <Text style={globalStyles.venueName}>{item.venueName}</Text>
                  </View>
                  <View style={globalStyles.infoRow}>
                    <MaterialIcons name="music-note" size={20} color="white" />
                    <Text style={globalStyles.genre}>{item.genre}</Text>
                  </View>

                  {/* Bottom Section - Play Button (Left) & Price/Date (Right) */}
                  <View style={globalStyles.bottomContainer}>
                    {/* Play Button (Bottom Left) */}
                    <TouchableOpacity 
                      style={globalStyles.playButton}
                      onPress={() => {
                        router.push(`/event/${item.id}`);
                      }}
                    >
                      <MaterialIcons name="play-arrow" size={20} color="red" />
                      <Text style={globalStyles.playText}>Play music demo</Text>
                    </TouchableOpacity>

                    {/* Price & Date (Bottom Right) */}
                    <View style={globalStyles.priceContainer}>
                      <Text style={globalStyles.price}>{formatPrice(item.price)}</Text>
                      <Text style={globalStyles.date}>{item.date}</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </ThemedView>
          </TouchableOpacity>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff585d" />
            <Text style={styles.loadingText}>Loading concerts...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color="#ff585d" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={forceRefresh}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Add these styles
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 15,
    marginTop: 10
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#ff585d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    color: '#ff585d',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#ff585d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: '500',
  }
});
