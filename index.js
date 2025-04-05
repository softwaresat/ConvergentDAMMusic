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


app.get('/login', function (request, response) {

})
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
    // if (price) {
    //   const maxPrice = parseInt(price);
    //   console.log(maxPrice)
    //   concerts = concerts.filter(concert => concert.price <= maxPrice);
    // }
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
