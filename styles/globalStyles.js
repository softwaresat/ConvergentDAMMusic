import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const globalStyles = StyleSheet.create({
  /* 🔲 Container */
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Changed from white to original style
  },

  /* 🔠 Search Bar */
  searchBar: {
    margin: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    fontSize: width * 0.04,
    color: 'black',
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
  },

  /* 🧾 Post Container */
  postContainer: {
    margin: 16,
    padding: 16, // Added from second style
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0', // Unified background
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
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  /* 🔲 Overlay */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 10,
  },

  /* 🎤 Artist Info */
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginLeft: 8,
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
    marginBottom: 3,
  },
  venueName: {
    color: 'white',
    fontSize: width * 0.04,
    marginLeft: 8,
    marginTop: 8, // From new styles
    fontWeight: 'bold',
  },
  genre: {
    color: 'white',
    fontSize: width * 0.04,
    marginLeft: 8,
  },

  /* 🚀 Bottom Container */
  bottomContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* 🔴 Play Button */
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  playText: {
    color: 'white',
    fontSize: width * 0.04,
    marginLeft: 5,
  },

  /* 💲 Price & Date */
  priceContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  price: {
    color: 'white',
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: 'white',
    fontSize: width * 0.04,
  },

  /* 📋 FlatList Content */
  flatListContent: {
    paddingBottom: 16,
  },
});

export default globalStyles;
