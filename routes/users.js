//'use strict';
/*jshint esversion: 6 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-as-promised');
var config = require('../knexfile')['development'];
var knex = require('knex')(config);
const passport = require('passport');

/*  ====================================================================
                mapbox setup
====================================================================  */

//public key used to access info with a get request

let token = "pk.eyJ1IjoibWF3YXJyZW4iLCJhIjoiY2piZmdlODFuMnlzejJycGU2amoxdG44NyJ9.GlbjGsu0VqzCls45AniQgw";

var mapboxClient = require('mapbox')
var client = new mapboxClient(token);

var locationsFeatureCollection = {
  "type": "FeatureCollection",
  "features": []
};
var tempLocation;
var tempName;



/*  ====================================================================
              mapbox functions to get and geocode locations
====================================================================  */

// get coordinates for spot locations in database

function getGeoLocations() {
  knex('spots').select('spot_location')
    .then(function(results) {
      let locationResults = results;

      locationResults.forEach(function(location) {
        tempLocation = location.spot_location;

        client.geocodeForward(`${tempLocation}`, geo);

      });
    });
}


// create a feature object with spot coordinates to add pins on the map

function geo(err, data, results) {

  if (err) {
    console.error(err);
  }

  locationFeatures = data.features;

  locationFeatures.forEach(function(feature) {

    knex('spots').where('spot_location', feature.place_name)
      .then(function(results) {

        if (results.length) {
          locationsFeatureCollection.features.push({
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": feature.geometry.coordinates
            },
            "properties": {
              "address": feature.place_name,
              "name": results[0].spot_name
            }
          });
        }
      });
  });
}

  getGeoLocations();


  /*  ====================================================================
                get user login page
  ====================================================================  */

router.get('/', function(req, res) {
  console.log(req.session.passport.user, 'WTF');
  res.render('index');
});

/*  ====================================================================
              get main spot page (only if user is logged in)
====================================================================  */

router.get('/main', isLoggedIn, function(req, res) {
  //map locations
  let feature = JSON.stringify(locationsFeatureCollection);
  res.render('main', {user: req.session.passport.user, feature: feature});
});

/*  ====================================================================
  get individual spot page that user clicked on (only if user is logged in)
====================================================================  */

router.post('/location', isLoggedIn, function(req, res) {
  console.log(req.body, 'THIS IS THE REQUEST FROM THE SUBMIT');

  let featureSpot = {
    "type": "FeatureCollection",
    "features": []
  };

  locationsFeatureCollection.features.forEach(function(feature) {
    if (feature.properties.name === req.body.spot_name) {
      featureSpot.features.push(feature);
    }
  });

  let featureSpotString = JSON.stringify(featureSpot);

  knex('spots').where('spot_name', req.body.spot_name)
  .then(function (results) {
    let spot = results;
    console.log(featureSpotString, 'FEAUTREEEEEE YOU CLICKEDDDDDDDDDD');

    res.render('location', {user: req.session.passport.user, feature: featureSpotString, spot: spot});
  });
});

/*  ====================================================================
      get test page to make sure sessions is working correctly
====================================================================  */

router.get('/success', isLoggedIn, function(req, res) {
  res.render('success', {user: req.session.passport.user});
});

/*  ====================================================================
        get logout page when user ends their session
====================================================================  */

router.get('/logout', function(req, res) {
  req.logout();
  console.log(req.session.passport, 'AFTER LOGOUT');
  res.render('logout', {user: req.session.passport.user});
});

/*  ====================================================================
  get signup page where users can create a new account
====================================================================  */

router.get('/signup', function(req, res) {
  res.render('signup');
});

/*  ====================================================================
  create a new user and add them to the database with info from signup page
====================================================================  */

router.post('/signup', (req, res, next) => {

  bcrypt.hash(req.body.password, 12)
    .then((hashed_password) => {

      return knex('users')
        .insert({
          full_name: req.body.full_name,
          email: req.body.email,
          hashed_password: hashed_password,
          profile_photo: req.body.profile_photo
        }, '*');
    })
    .then((users) => {
      const user = users[0];
      delete user.hashed_password;
      res.send(user);
    })
    .catch((err) => {
      next(err);
    });
});


/*  ====================================================================
      get login page for existing users to sign in
====================================================================  */

router.get('/login', function(req, res) {
  res.render('login');
});

/*  ====================================================================
if login is correct then redirect to index if not go back to login screen
====================================================================  */

router.post('/login', passport.authenticate('login', {
  successRedirect : '/users/main',
  failureRedirect: '/login',
  failureFlash : true

}));




/*  ====================================================================
        route middleware function to make sure user is logged in
====================================================================  */

function isLoggedIn(req, res, next) {

  //if user is authenticated in the session, cowabunga
  if(req.isAuthenticated())
  console.log(req.user, 'i am authenticated');
  return next();

  // if they aren't redirect to login page
  console.log('failllll you arent logged in');
  res.redirect('/users/login');
}




router.use(function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.sendStatus(404);
});


module.exports = router;
