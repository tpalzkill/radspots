/*jshint esversion: 6 */


var express = require('express');
//const app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var config = require('../knexfile')['development'];
var knex = require('knex')(config);
var port = process.env.PORT || 8000
//var https = require('https');
//var request = require('request');


//public key used to access info with a get request
let token = "pk.eyJ1IjoibWF3YXJyZW4iLCJhIjoiY2piZmdlODFuMnlzejJycGU2amoxdG44NyJ9.GlbjGsu0VqzCls45AniQgw"

//secret key used for write/edit
let writeToken = "sk.eyJ1IjoibWF3YXJyZW4iLCJhIjoiY2piaW9oajhtM3dndzMybm9rc25xaWdxOCJ9.XuFIcAKcNwjdOVhFtGx4Lg"

var mapboxClient = require('mapbox')
var client = new mapboxClient(token)

var locationsFeatureCollection = {
  "type": "FeatureCollection",
  "features": []
}
var tempLocation;
var tempName;


// router.get('/map', function(req, res) {
//   res.send('lame')
// })

// get coordinates for spot locations in database
function getGeoLocations() {
  knex('spots').select('spot_location')
    .then(function(results) {
      let locationResults = results;

      locationResults.forEach(function(location) {
        tempLocation = location.spot_location

        client.geocodeForward(`${tempLocation}`, geo)

      })
    })
}


// create a feature object with spot coordinates to add pins on the map
function geo(err, data, results) {

  if (err) {
    console.error(err)
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
          })
        }
      })
  })
}

getGeoLocations()


//add feature object to the map
router.get('/', function(req, res) {

  let feature = JSON.stringify(locationsFeatureCollection)

  res.render('map', {
    feature: feature
  });
  //})

})







router.use(function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.sendStatus(404);
});

module.exports = router;
