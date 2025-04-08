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
    
    // Sign in with Firebase Admin SDK
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    let userData = { email: userRecord.email };
    
    if (userDoc.exists) {
      userData = { ...userData, ...userDoc.data() };
    }
    
    // Create a custom token for the client
    const token = await admin.auth().createCustomToken(userRecord.uid);
    
    // Send response with user data and token
    res.status(200).json({ 
      message: 'Login successful', 
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        username: userData.username || userRecord.displayName,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.status(500).json({ message: 'Authentication failed', error: error.message });
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
