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

app.listen(3000, () => console.log('Server is live on port 3000!'))