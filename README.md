# StageNextDoor - Local Music Discovery App

<p align="center">
  <img src="assets/images/icon.png" alt="StageNextDoor Logo" width="200"/>
</p>

StageNextDoor is a mobile application designed to connect music lovers with local artists and performances happening near them. The app helps users discover, explore, and attend concerts and performances in their area, supporting local music scenes and providing artists with a platform to reach new audiences.

## Features

- **Concert Discovery**: Browse and search for upcoming concerts and performances
- **Interactive Map**: Explore events geographically with our intuitive map interface
- **Personalized Recommendations**: Get concert recommendations based on your music preferences
- **Artist Profiles**: Learn more about performers with detailed profiles and music previews
- **Genre Filtering**: Find performances by your favorite music genres
- **Location-Based Search**: Discover concerts within your preferred travel distance
- **User Accounts**: Create a profile to track your favorite artists and attended concerts

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Backend**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Custom authentication with AsyncStorage
- **Maps**: React Native Maps
- **UI Components**: Custom themed components

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ConvergentDAMMusic.git
   cd ConvergentDAMMusic/Convergent_DAM_Music
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the project root with the following variables:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   OPENCAGE_API_KEY=your_opencage_api_key
   ```

4. Start the development server
   ```bash
   npx expo start
   ```

### Running the Backend

The app includes a backend server for API endpoints. To run it:

```bash
node index.js
```

The server will start on port 3000.

## Project Structure

- `app/` - Main application code using Expo Router
  - `(tabs)/` - Tab-based navigation screens
  - `event/` - Event detail pages
  - `_layout.tsx` - Root layout with authentication logic
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks including Firebase integration
- `styles/` - Global styling definitions
- `assets/` - Images, fonts, and other static assets
- `lib/` - Utility functions and helpers

## Authentication Flow

The app uses a custom authentication system with AsyncStorage for token management:

1. User signs up or logs in via dedicated screens
2. User data and authentication token are stored in AsyncStorage
3. The AuthProvider in `_layout.tsx` checks authentication status
4. Protected routes redirect unauthenticated users to the login screen

## Data Management

Concert data is stored in Firebase Firestore. The app includes:

- A sample concert dataset in `concerts.json`
- A seeding script (`seedConcerts.js`) to populate the database
- API endpoints for filtered queries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Developed as part of the Convergent DAM Music project
- UI design inspired by modern music streaming platforms
- Thanks to all contributors and testers
