import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const globalStyles = StyleSheet.create({
  /* 🔲 Container */
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* 🔠 Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 10,
    margin: 16,
    height: 40,
  },
  searchIcon: {
    color: 'black',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterIcon: {
    color: 'black',
    marginLeft: 8,
  },

  /* 📄 Header Section */
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
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 16,
    color: '#fff', // White text for dark background
    marginBottom: 8,
  },

  /* 🧾 Post Container */
  postContainer: {
    margin: 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1c1c1c',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
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

  /* 🖼️ Poster Image */
  posterImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  /* 🔲 Overlay */
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },

  /* 🎤 Artist Info */
  artistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* 🎵 Actions */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginRight: 8,
  },

  /* 📍 Venue & Genre */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
  },
  genre: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },

  /* 🚀 Bottom Container */
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },

  /* 🔴 Play Button */
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playText: {
    color: 'red',
    marginLeft: 4,
    fontSize: 14,
  },

  /* 💲 Price & Date */
  priceContainer: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  price: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#aaa',
    fontSize: 12,
  },

  /* 📋 FlatList Content */
  flatListContent: {
    paddingBottom: 16,
  },

  /* 🔲 Filter Screen Styles */
  filterContainer: {
    flex: 1,
    backgroundColor: '#000', // Set to black for better contrast
    padding: 16,
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

  /* 🔴 Apply Button */
  applyButton: {
    backgroundColor: 'red', // Red background for the button
    borderRadius: 20, // Rounded corners
    paddingVertical: 12, // Vertical padding for the button
    alignItems: 'center', // Center the text horizontally
    marginTop: 16, // Add spacing above the button
  },
  applyButtonText: {
    color: '#fff', // White text color
    fontSize: 16, // Font size for the text
    fontWeight: 'bold', // Bold text
  }, // Missing closing brace added here
  /* 📸 Blurred Header Image */
  blurredWrapper: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  blurOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* 🧾 Event Details */
  eventImage: {
    width: '90%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
    alignSelf: 'center',
  },
  description: {
    color: '#ccc',
    marginBottom: 24,
  },
  subheading: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  rowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: 'white',
    marginLeft: 8,
  },
  detailsBox: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
  },
  detailItem: {
    color: 'white',
    marginVertical: 4,
  },
  rsvpButton: {
    backgroundColor: '#e63946',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  rsvpText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  /* 🗺️ Fullscreen Map Overlay */
  fullscreenBackground: {
    flex: 1,
  },
  fullscreenBlurOverlay: {
    flex: 1,
    paddingTop: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* 🎵 Genre Grid */
  genreGrid: {
    justifyContent: 'center',
  },
  genreTile: {
    flex: 1,
    margin: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  selectedGenreTile: {
    backgroundColor: '#fff',
  },
  genreText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedGenreText: {
    color: '#000', // Now text stays visible on white background
  },  
  /* 🎵 Genre Browse Button */
  genreButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 16,
  },
  genreButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  genreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  
  /* 🔄 Carousel Styles */
  carouselContainer: {
    marginBottom: 24,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 12,
  },
  carouselList: {
    paddingLeft: 16,
  },
  carouselItem: {
    width: width * 0.75,
    marginRight: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: 160,
    justifyContent: 'flex-end',
  },
  carouselOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  carouselArtistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carouselVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  carouselVenueName: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  carouselGenreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carouselGenre: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
  },

  /* Filter Indicator Styles */
  filteredInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filteredText: {
    color: '#fff',
    fontSize: 14,
  },
  clearFiltersButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default globalStyles;
