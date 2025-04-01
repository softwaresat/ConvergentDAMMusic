import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const globalStyles = StyleSheet.create({
  /* 🔲 Container */
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for the app
  },

  /* 🔠 Search Bar */
  searchBar: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center items vertically
    backgroundColor: '#e0e0e0', // Light gray background
    borderRadius: 20, // Rounded corners
    paddingHorizontal: 10, // Horizontal padding inside the container
    margin: 16, // Margin around the search bar
    height: 40, // Fixed height for the search bar
  },
  searchIcon: {
    color: "black",
    marginRight: 8, // Space between the search icon and the text input
  },
  searchInput: {
    flex: 1, // Take up remaining space
    fontSize: 16, // Font size for the input text
    color: '#000', // Black text color
  },
  filterIcon: { 
    color: "black",
    marginLeft: 8, // Space between the text input and the filter icon
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
    fontSize: 18,
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
    overflow: 'hidden', // Ensure content stays within rounded corners
    backgroundColor: '#1c1c1c', // Dark background for the card
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
    height: 200, // Fixed height for the image
    justifyContent: 'flex-end', // Align overlay content to the bottom
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  /* 🔲 Overlay */
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
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
    justifyContent: 'space-between', // Space between artist info and actions
    alignItems: 'center',
    marginBottom: 8,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    color: '#fff', // White text for artist name
    marginLeft: 8, // Space between icon and text
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* 🎵 Actions */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginRight: 8, // Space between action icons
  },

  /* 📍 Venue & Genre */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    color: '#fff', // White text for venue name
    marginLeft: 8, // Space between icon and text
    fontSize: 14,
    marginTop: 8, // From new styles
    fontWeight: 'bold',
  },
  genre: {
    color: '#fff', // White text for genre
    marginLeft: 8,
    fontSize: 14,
  },

  /* 🚀 Bottom Container */
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between play button and price/date
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
  },
  playText: {
    color: 'red', // Red text for play button
    marginLeft: 4, // Space between icon and text
    fontSize: 14,
  },

  /* 💲 Price & Date */
  priceContainer: {
    alignItems: 'flex-end', // Align price and date to the right
    alignSelf: 'flex-end',
  },
  price: {
    color: '#fff', // White text for price
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#aaa', // Light gray text for date
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
  },
});

export default globalStyles;
