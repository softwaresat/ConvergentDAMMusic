const express = require('express')
const app = express()
const router = express.Router();
const path = require('path');
const https = require('https')
var http = require('http').Server(app);

const { db } = require('./firebaseAdmin'); // Import Firestore instance

const { response } = require('express');

app.use(express.static('assets'))
app.use(express.json({
  limit: '50mb'
}));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true
}));

app.set('trust proxy', true);

const bodyParser = require('body-parser');

app.use(bodyParser.json());

const users = []; // Temporary in-memory storage for users

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Query Firestore users collection for the user with matching email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Get user data
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if passwords match (in a real app, use bcrypt to compare hashed passwords)
    if (userData.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate a simple token
    const token = Buffer.from(`${userDoc.id}:${Date.now()}`).toString('base64');
    
    // Send response without sending the password back
    const { password: _, ...userDataWithoutPassword } = userData;
    
    res.status(200).json({ 
      message: 'Login successful', 
      user: {
        id: userDoc.id,
        ...userDataWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    
    // Check if email already exists
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();
    
    if (!existingUser.empty) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    // Create new user document in Firestore
    const newUserRef = await usersRef.add({
      username,
      email,
      password, // In a production app, hash this password
      createdAt: new Date(),
      attendedConcerts: [],
      favoriteGenres: [],
      savedConcerts: []
    });
    
    // Generate a simple token
    const token = Buffer.from(`${newUserRef.id}:${Date.now()}`).toString('base64');
    
    // Get the created user
    const newUserDoc = await newUserRef.get();
    const userData = newUserDoc.data();
    
    // Remove password from response
    const { password: _, ...userDataWithoutPassword } = userData;
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUserRef.id,
        ...userDataWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

app.get('/user', async function (request, response) {
    try {
        const itemsSnapshot = await db.collection('users').get();
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // response.status(200).json(items);
      } catch (error) {
        console.error('Error getting items:', error);
        // response.status(500).send('Error getting items');
      }

})


app.post('/newaccount', async function (request, response) {

});
app.post('/newevent', async function (request, response) {

});
app.post('/newitem', async function (request, response) {

});

// Login Authentication
app.post('/auth', async function (request, response) {
  // Your authentication logic here
});

// Get items from Firestore
app.get('/items', async function (request, response) {
  try {
    const itemsSnapshot = await db.collection('items').get();
    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(items);
    response.status(200).json(items);
  } catch (error) {
    console.error('Error getting items:', error);
    response.status(500).send('Error getting items');
  }
});

// Add /concerts endpoint:
app.get('/concerts', async function(req, res) {
  const { price, date, location, genres } = req.query;
  try {
    let concertsSnapshot = await db.collection('concerts').get();
    let concerts = concertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Filter by price if provided (concert.price should be less than or equal)
    if (price) {
      const maxPrice = parseInt(price);
      console.log(maxPrice)
      concerts = concerts.filter(concert => concert.price <= maxPrice);
    }
    // Filter by date if provided and not 'Custom'
    // if (date && date !== 'Custom') {
    //   console.log("date")
    //   concerts = concerts.filter(concert => concert.date === date);
    // }
    // Filter by location if provided and not 'Custom'
    // if (location && location !== 'Custom') {
    //   console.log("location")

    //   const maxMiles = parseInt(location.replace('<', '').replace(' miles', ''));
    //   concerts = concerts.filter(concert => concert.distance <= maxMiles);
    // }
    // Filter by genres if provided (assuming concert.genres is an array)
    if (genres) {

      const genreArr = genres.split(',');
      concerts = concerts.filter(concert =>
        concert.genre && genreArr.some(g => concert.genre.includes(g))
      );
    }
    res.status(200).json(concerts);
  } catch (error) {
    console.error('Error getting concerts:', error);
    res.status(500).send('Error getting concerts');
  }
});

app.listen(3000, '0.0.0.0', () => { console.log("Server is live!") });
