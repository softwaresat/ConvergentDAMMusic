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
    alignSelf: 'center', // ✅ Center horizontally
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
  fullscreenBackground: {
    flex: 1,
  },
  fullscreenBlurOverlay: {
    flex: 1,
    paddingTop: 48, // helps with safe area
  },  
});

export default globalStyles;
