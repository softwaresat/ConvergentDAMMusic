import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../hooks/firebase';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const db = getFirestore();

  // Function to create a proper Firestore document for the user
  const createFirestoreUserDocument = async (userId, userEmail, displayName) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn("Cannot create user document: No authenticated user");
        return false;
      }

      await currentUser.getIdToken(true);

      const userDocRef = doc(db, "users", userId);

      await setDoc(userDocRef, {
        uid: userId,
        email: userEmail,
        username: displayName,
        displayName: displayName,
        favoriteGenres: [],
        attendedConcerts: [],
        savedConcerts: [],
        createdAt: new Date().toISOString(),
        bio: "",
        followers: 0,
        following: [],
        location: {
          city: "",
          state: ""
        },
        profileImageUrl: "",
        lastLogin: new Date().toISOString()
      }, { merge: true });

      console.log("Created Firestore document for new user:", userId);
      return true;
    } catch (error) {
      console.error("Error creating Firestore document:", error);
      return false;
    }
  };

  const handleSignup = async () => {
    // Input validation
    if (!username || !email || !password) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // We'll use Promise.race to manage timeout and retries behind the scenes
      const makeRequest = async () => {
        try {
          const response = await fetch('https://convergentdammusic.onrender.com/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            // Handle the case where email already exists
            if (data.message && data.message.includes('email already in use') || 
                data.message && data.message.includes('already exists') ||
                response.status === 409) {
              throw { type: 'exist', message: "This email is already registered." };
            }
            throw new Error(data.message || 'Signup failed');
          }
          
          return data;
        } catch (error) {
          if (error.type === 'exist') {
            throw error; // Re-throw account exists error
          }
          throw new Error('Request failed');
        }
      };
      
      // Create a timeout promise
      const timeout = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), ms)
      );
      
      // Try multiple times with increasing timeouts
      let lastError = null;
      const timeouts = [15000, 25000, 40000]; // Progressive timeouts
      
      for (let i = 0; i < timeouts.length; i++) {
        try {
          // Race between the request and the timeout
          const data = await Promise.race([
            makeRequest(),
            timeout(timeouts[i])
          ]);
          
          // If we get here, the request succeeded
          
          // Create a complete user data object
          const userDataObj = {
            uid: data.user.id,
            email: data.user.email,
            displayName: username,
            attendedConcerts: [],
            favoriteGenres: [],
            savedConcerts: []
          };
          
          // Save user data to AsyncStorage
          await Promise.all([
            AsyncStorage.setItem('userToken', data.user.token || ''),
            AsyncStorage.setItem('userData', JSON.stringify(userDataObj)),
            AsyncStorage.setItem('fromSignup', 'true')
          ]);
          
          // Create the user document in Firestore with proper structure
          await createFirestoreUserDocument(data.user.id, data.user.email, username);
          
          // Navigate directly to the genres page WITHOUT showing the success screen
          router.replace({
            pathname: '/(tabs)/genres_poll',
            params: { 
              fastLoad: 'true' 
            }
          });
          
          return;
        } catch (error) {
          if (error.type === 'exist') {
            // Handle existing account case
            Alert.alert(
              "Account Already Exists",
              "This email is already registered. Would you like to login instead?",
              [
                {
                  text: "Go to Login",
                  onPress: () => router.push('/login')
                },
                {
                  text: "Cancel",
                  style: "cancel"
                }
              ]
            );
            return;
          }
          // Store the error but keep trying if we haven't exhausted all timeouts
          lastError = error;
        }
      }
      
      // If we get here, all attempts failed
      throw new Error('The server is taking too long to respond. Please try again later.');
      
    } catch (error) {
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome to StageNextDoor</Text>
      <Text style={styles.subtitle}>Sign up and join your local music community</Text>

      <>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setError('');
          }}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError('');
          }}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loadingText}>Creating account...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already Have An Account?{' '}
          <Text style={styles.link} onPress={() => router.push('/login')}>Log In</Text>
        </Text>
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  continueButton: {
    backgroundColor: '#4285F4',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
  },
  link: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF0000',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressText: {
    color: '#4CAF50',
    marginBottom: 15,
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});
