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
  res.render('main', {
    user: req.session.passport.user,
    feature: feature
  });
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
  var comments;

console.log(req.body.upvote, 'REQ BODY UPVOTE')
  // if you received a upvote request
  if (req.body.upvote) {
    console.log('helloooooooooooooooooooooooooo')
    knex('spots').where('spot_name', req.body.spot_name)
      .then(function(results) {
        let upvoteVal = results[0].upvotes

        return knex ('spots').where('spot_name', req.body.spot_name)
        .update({upvotes: upvoteVal + 1})

        .then(function() {
          knex('comments').where('spot_id', req.body.spot_id)
            .join('users', 'comments.user_id', 'users.id')
            .then(function(results) {
              comments = results;

              locationsFeatureCollection.features.forEach(function(feature) {
                if (feature.properties.name === req.body.spot_name) {
                  featureSpot.features.push(feature);
                }
              });

              let featureSpotString = JSON.stringify(featureSpot);

              knex('spots').where('spot_name', req.body.spot_name)
                .then(function(results) {
                  let spot = results;
                  console.log(featureSpotString, 'FEAUTREEEEEE YOU CLICKEDDDDDDDDDD');

                  knex('users')
                  .join('checkins', 'users.id', 'checkins.user_id')
                    .then(function(results) {
                      let checkins = results;

  console.log (checkins, 'CHECKIN FOR CHECKIN REQUEST')
                      res.render('location', {
                        user: req.session.passport.user,
                        feature: featureSpotString,
                        spot: spot,
                        comments: comments,
                        checkins: checkins
                      });
                    });
                });
            });
        });
    });


  }

  // if you received a post request with a comment
  if (req.body.comment) {

    let checkins2;
    return knex('comments')
      .insert({
        user_id: req.session.passport.user[0].id,
        spot_id: req.body.spot_id,
        comment: req.body.comment
      })
      .then(function() {
        knex('comments').where('spot_id', req.body.spot_id)
          .join('users', 'comments.user_id', 'users.id')
          .then(function(results) {
            comments = results;

            locationsFeatureCollection.features.forEach(function(feature) {
              if (feature.properties.name === req.body.spot_name) {
                featureSpot.features.push(feature);
              }
            });

            let featureSpotString = JSON.stringify(featureSpot);

            knex('spots').where('spot_name', req.body.spot_name)
              .then(function(results) {
                let spot = results;

                knex('checkins')
                  .then(function(results) {
                    var checkins2;
                    console.log(results, 'RESULTSSSSSSSSSSSSSSSSSSS')
                    if (results) {
                      knex('users')
                      .join('checkins', 'users.id', 'checkins.user_id')
                        .then(function(results) {
                          console.log(results, 'CHECKINS2 RESULTS')
                            checkins2 = results;
                            console.log(checkins2, 'CHECKINS2222222')
                            res.render('location', {
                              user: req.session.passport.user,
                              feature: featureSpotString,
                              spot: spot,
                              comments: comments,
                              checkins: checkins2
                            });
                        })

                    } else {
                      checkins2 = "";
                    console.log(checkins2, 'CHECKINS FOR COMMENT')
                    res.render('location', {
                      user: req.session.passport.user,
                      feature: featureSpotString,
                      spot: spot,
                      comments: comments,
                      checkins: checkins2
                    });
                  }
                  });
              });
          });
      });

  }

  // if you didn't receive a request with a comment or a checkin request
  if (!req.body.comment && !req.body.checkin && !req.body.upvote) {

    locationsFeatureCollection.features.forEach(function(feature) {
      if (feature.properties.name === req.body.spot_name) {
        featureSpot.features.push(feature);
      }
    });

    let featureSpotString = JSON.stringify(featureSpot);

    knex('spots').where('spot_name', req.body.spot_name)
      .then(function(results) {
        let spot = results;


        knex('checkins')
          .then(function(results) {


              if (results) {
                knex('users')
                .join('checkins', 'users.id', 'checkins.user_id')
                  .then(function(results) {
                      checkins = results;
                  })

            } else {
              checkins = "";
            }

            knex('comments').where('spot_id', spot[0].id)
              .join('users', 'comments.user_id', 'users.id')
              .then(function(results) {
console.log(checkins, 'CHECKINS FOR NO COMMENT OR CHECKIN')
                res.render('location', {
                  user: req.session.passport.user,
                  feature: featureSpotString,
                  spot: spot,
                  comments: results,
                  checkins: checkins
                });
              })
          })
      });
  }

  // if you received a checkin request
  if (req.body.checkin) {
    console.log(req.body, 'REQUEST BODY OF THE CHECKIN')
    return knex('checkins')
      .insert({
        user_id: req.session.passport.user[0].id,
        spot_id: req.body.spot_id,
        checkin: req.body.checkin
      })
      .then(function() {
        knex('comments').where('spot_id', req.body.spot_id)
          .join('users', 'comments.user_id', 'users.id')
          .then(function(results) {
            comments = results;

            locationsFeatureCollection.features.forEach(function(feature) {
              if (feature.properties.name === req.body.spot_name) {
                featureSpot.features.push(feature);
              }
            });

            let featureSpotString = JSON.stringify(featureSpot);

            knex('spots').where('spot_name', req.body.spot_name)
              .then(function(results) {
                let spot = results;
                console.log(featureSpotString, 'FEAUTREEEEEE YOU CLICKEDDDDDDDDDD');

                knex('users')
                .join('checkins', 'users.id', 'checkins.user_id')
                  .then(function(results) {
                    let checkins = results;

console.log (checkins, 'CHECKIN FOR CHECKIN REQUEST')
                    res.render('location', {
                      user: req.session.passport.user,
                      feature: featureSpotString,
                      spot: spot,
                      comments: comments,
                      checkins: checkins
                    });
                  });
              });
          });
      });









  }


});

/*  ====================================================================
  get individual spot page with added comments/ add comments to database
====================================================================  */

// router.get('/location', isLoggedIn, function(req, res) {
//   console.log(req.body, 'REQ BODY FROM GET LOCATION')
//   return knex('comments')
//   .insert({
//     user_id : req.session.passport.user.id,
//     spot_id : req.body.spot_id,
//     comment: req.body.comment
//   })
//   .then(function () {
//     knex('comments').where('spot_id', req.body.spot_id)
//     .then(function (results) {
//       let comments = results;
//       res.render('location', {user:req.session.passport.user, comments:comments})
//     })
//   })
//
// })


/*  ====================================================================
      THIS IS TO TEST SO MAPBOX WONT BE MAD
      DELETE ME LATER
====================================================================  */

// router.get('/location', isLoggedIn, function(req, res) {
//   //map locations
//   //let feature = JSON.stringify(locationsFeatureCollection);
//
//   let user = [ {
//     id: 2,
//     email: 'me2@gmail.com',
//     full_name: 'me2',
//     profile_photo: null } ]
//
//   let feature = [{
//   "type":"Feature",
//   "geometry":{
//     "type":"Point",
//     "coordinates":[-97.775916,30.22728]
//   },
//   "properties":{
//     "address":"1077 W Ben White Blvd, Austin, Texas 78745, United States",
//     "name":"Banister Ditch"}}]
//   res.render('location', {user: user, feature: feature, spot: feature});
// });


/*  ====================================================================
      get test page to make sure sessions is working correctly
====================================================================  */

router.get('/success', isLoggedIn, function(req, res) {
  res.render('success', {
    user: req.session.passport.user
  });
});

/*  ====================================================================
        get logout page when user ends their session
====================================================================  */

router.get('/logout', function(req, res) {
  req.logout();
  console.log(req.session.passport, 'AFTER LOGOUT');
  res.render('logout', {
    user: req.session.passport.user
  });
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
  successRedirect: '/users/main',
  failureRedirect: '/login',
  failureFlash: true

}));

/*  ====================================================================
                get user profile page if logged in
====================================================================  */

router.get('/profile', isLoggedIn, function(req, res) {

  res.render('profile', {
    user: req.session.passport.user
  });

});


/*  ====================================================================
        route middleware function to make sure user is logged in
====================================================================  */

function isLoggedIn(req, res, next) {

  //if user is authenticated in the session, cowabunga
  if (req.isAuthenticated())
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
