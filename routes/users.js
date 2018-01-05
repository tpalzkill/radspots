//'use strict';
/*jshint esversion: 6 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-as-promised');
var config = require('../knexfile')['production'];
var knex = require('knex')(config);
const passport = require('passport');
var url = require('url');

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



    /* ..................................................................
         if you received a upvote request
    ..................................................................*/

    if (req.body.upvote) {
      console.log('helloooooooooooooooooooooooooo');
      knex('spots').where('spot_name', req.body.spot_name)
        .then(function(results) {
          let upvoteVal = results[0].upvotes;

          return knex('spots').where('spot_name', req.body.spot_name)
            .update({
              upvotes: upvoteVal + 1
            })

            .then(function() {
              knex('users')
                .join('comments', 'comments.user_id', 'users.id')
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

                      knex('checkins')
                        .then(function(results) {
                          var checkins;

                          if (results) {

                            knex('users')
                              .join('checkins', 'users.id', 'checkins.user_id')
                              .then(function(results) {
                                checkins = results;
                              });
                          } else {
                            checkins = "";
                          }

                          knex('users')
                            .join('photos', 'photos.user_id', 'users.id')
                            .then(function(results) {
                              let photos;

                              if (results) {
                                photos = results;
                              } else {
                                photos = "";
                              }

                              knex('users')
                                .join('videos', 'videos.user_id', 'users.id')
                                .then(function(results) {
                                  let videos;

                                  if (results) {
                                    videos = results;
                                  } else {
                                    videos = "";
                                  }


                                  console.log(checkins, 'CHECKIN FOR CHECKIN REQUEST');
                                  res.render('location', {
                                    user: req.session.passport.user,
                                    feature: featureSpotString,
                                    spot: spot,
                                    comments: comments,
                                    checkins: checkins,
                                    photos: photos,
                                    videos: videos
                                  });
                                });
                            });
                        });
                    });
                });
            });
        })
    }


    /* ..................................................................
         if you received a post request with a comment
    ..................................................................*/


    if (req.body.comment) {

      let checkins2;
      return knex('comments')
        .insert({
          user_id: req.session.passport.user[0].id,
          spot_id: req.body.spot_id,
          comment: req.body.comment
        })
        .then(function() {
          knex('users')
            .join('comments', 'comments.user_id', 'users.id')
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
                  var spot = results;
                  var photos;

                  knex('users')
                    .join('photos', 'photos.user_id', 'users.id')
                    .then(function(results) {


                      if (results) {
                        photos = results;
                      } else {
                        photos = "";
                      }
                    });

                  knex('users')
                  .join('videos', 'videos.user_id', 'users.id')
                    .then(function(results) {
                      let videos;

                      if (results) {
                        videos = results;
                      } else {
                        videos = "";
                      }


                      knex('checkins')
                        .then(function(results) {
                          var checkins2;

                          if (results) {
                            knex('users')
                              .join('checkins', 'users.id', 'checkins.user_id')
                              .then(function(results) {
                                checkins2 = results;

                                res.render('location', {
                                  user: req.session.passport.user,
                                  feature: featureSpotString,
                                  spot: spot,
                                  comments: comments,
                                  checkins: checkins2,
                                  photos: photos,
                                  videos: videos
                                });
                              })

                          } else {
                            checkins2 = "";

                            res.render('location', {
                              user: req.session.passport.user,
                              feature: featureSpotString,
                              spot: spot,
                              comments: comments,
                              checkins: checkins2,
                              photos: photos,
                              videos: videos
                            });
                          }
                        });
                    });
                });
            });
        });
    }




/* ..................................................................
  if you didn't receive a request with a comment or a checkin request or upvote request or photo request or video request..ugh
..................................................................*/


if (!req.body.comment && !req.body.checkin && !req.body.upvote && !req.body.photo && !req.body.video) {

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

          knex('users')
            .join('comments', 'comments.user_id', 'users.id')
            .then(function(results) {
              let comments = results;

              knex('users')
                .join('photos', 'photos.user_id', 'users.id')
                .then(function(results) {
                  let photos;

                  if (results) {
                    photos = results;
                  } else {
                    photos = "";
                  };

                  knex('users')
                  .join('videos', 'videos.user_id', 'users.id')
                    .then(function(results) {
                      let videos;

                      if (results) {
                        videos = results;
                      } else {
                        videos = "";
                      }


                      res.render('location', {
                        user: req.session.passport.user,
                        feature: featureSpotString,
                        spot: spot,
                        comments: comments,
                        checkins: checkins,
                        photos: photos,
                        videos: videos
                      });
                    })
                })
            })
        });
    })
}


/* ..................................................................
              if you received a checkin request
..................................................................*/


if (req.body.checkin) {

  return knex('checkins')
    .insert({
      user_id: req.session.passport.user[0].id,
      spot_id: req.body.spot_id,
      checkin: req.body.checkin
    })
    .then(function() {
      knex('users')
        .join('comments', 'comments.user_id', 'users.id')
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

              knex('users')
                .join('checkins', 'users.id', 'checkins.user_id')
                .then(function(results) {
                  let checkins = results;

                  knex('users')
                    .join('photos', 'photos.user_id', 'users.id')
                    .then(function(results) {
                      let photos;

                      if (results) {
                        photos = results;
                      } else {
                        photos = "";
                      };

                      knex('users')
                      .join('videos', 'videos.user_id', 'users.id')
                        .then(function(results) {
                          let videos;

                          if (results) {
                            videos = results;
                          } else {
                            videos = "";
                          }


                          res.render('location', {
                            user: req.session.passport.user,
                            feature: featureSpotString,
                            spot: spot,
                            comments: comments,
                            checkins: checkins,
                            photos: photos,
                            videos: videos
                          });
                        });
                    });
                });
            });
        });
    })
}


/* ..................................................................
          if you received an add photo request
..................................................................*/


if (req.body.photo) {
  console.log('HELLO I AM HERE PLEASE RENDER ')
  knex('photos')
    .insert({
      user_id: req.session.passport.user[0].id,
      spot_id: parseInt(req.body.spot_id),
      photo: req.body.photo,
      upvotes: 0
    })
    .then(function() {
      knex('users').where('id', req.session.passport.user[0].id)
        .join('photos', 'photos.user_id', 'users.id')
        .then(function(results) {
          let photos = results;

          locationsFeatureCollection.features.forEach(function(feature) {
            if (feature.properties.name === req.body.spot_name) {
              featureSpot.features.push(feature);
            }
          });

          let featureSpotString = JSON.stringify(featureSpot);

          knex('spots').where('id', req.body.spot_id)
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

                  knex('users')
                    .join('comments', 'comments.user_id', 'users.id')
                    .then(function(results) {
                      console.log('IM RENDERINGGGGGGGGGGGGGGGGGG')
                      let comments = results;

                      knex('users')
                      .join('videos', 'videos.user_id', 'users.id')
                        .then(function(results) {
                          let videos;

                          if (results) {
                            videos = results;
                          } else {
                            videos = "";
                          }


                          res.render('location', {
                            user: req.session.passport.user,
                            feature: featureSpotString,
                            spot: spot,
                            comments: results,
                            checkins: checkins,
                            photos: photos,
                            videos: videos
                          });
                        })
                    });
                });
            });
        });
    });
}



/* ..................................................................
          if you received an add video request
..................................................................*/


if (req.body.video) {
  console.log('IM A VIDEOOOOOOOOOOO ')

  knex('videos')
    .insert({
      user_id: req.session.passport.user[0].id,
      spot_id: parseInt(req.body.spot_id),
      video: req.body.video,
      upvotes: 0
    })
    .then(function() {
      knex('users')
      .join('videos', 'videos.user_id', 'users.id')
        .then(function(results) {
          let videos = results;

          locationsFeatureCollection.features.forEach(function(feature) {
            if (feature.properties.name === req.body.spot_name) {
              featureSpot.features.push(feature);
            }
          });

          let featureSpotString = JSON.stringify(featureSpot);

          knex('spots').where('id', req.body.spot_id)
            .then(function(results) {
              let spot = results;


              knex('checkins')
                .then(function(results) {


                  if (results) {
                    knex('users')
                      .join('checkins', 'users.id', 'checkins.user_id')
                      .then(function(results) {
                        checkins = results;
                      });

                  } else {
                    checkins = "";
                  }

                  knex('users')
                    .join('comments', 'comments.user_id', 'users.id')
                    .then(function(results) {
                      console.log('IM RENDERINGGGGGGGGGGGGGGGGGG VIDEOOO');
                      let comments = results;

                      knex('users')
                      .join('photos', 'photos.user_id', 'users.id')
                        .then(function(results) {
                          let photos;

                          if (results) {
                            photos = results;
                          } else {
                            photos = "";
                          }




                          res.render('location', {
                            user: req.session.passport.user,
                            feature: featureSpotString,
                            spot: spot,
                            comments: comments,
                            checkins: checkins,
                            videos: videos,
                            photos: photos
                          });
                        });
                    });
                });
            });
        });
    });
}
})


/*  ====================================================================
  get individual spot page with added comments/ add comments to database
====================================================================  */

// router.get('/location', isLoggedIn, function(req, res) {
//   console.log(req.query,'HEY YOU DONE BE GOTTEN')
//     let spot_id = req.query.spot_id
//     let user_id = req.query.user_id
//     let photo =  req.query.photo
//   let featureSpot = {
//     "type": "FeatureCollection",
//     "features": []
//   };
//
//   locationsFeatureCollection.features.forEach(function(feature) {
//     if (feature.properties.name === req.body.spot_name) {
//       featureSpot.features.push(feature);
//     }
//   });
//
//   let featureSpotString = JSON.stringify(featureSpot);
//
//   knex('spots').where('id', spot_id)
//     .then(function(results) {
//       let spot = results;
//
//
//       knex('checkins')
//         .then(function(results) {
//
//
//           if (results) {
//             knex('users')
//               .join('checkins', 'users.id', 'checkins.user_id')
//               .then(function(results) {
//                 checkins = results;
//               })
//
//           } else {
//             checkins = "";
//           }
//
//           knex('users')
//             .join('comments', 'comments.user_id', 'users.id')
//             .then(function(results) {
//               let comments = results;
//
//               knex('photos')
//                 .then(function(results) {
//                   let photos;
//
//                   if (results) {
//                     photos = results;
//                   } else {
//                     photos = "";
//                   };
//
//
//                   res.render('location', {
//                     user: req.session.passport.user,
//                     feature: featureSpotString,
//                     spot: spot,
//                     comments: comments,
//                     checkins: checkins,
//                     photos: photos
//                   });
//                 })
//             });
//         });
//     });
//   });








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
      res.render('created');
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


  /* ..................................................................
       if you received a video like request
  ..................................................................*/

  // if (req.body.videoSpotName) {


//     knex('videos').where('spot_id', req.body.spot_id)
//       .then(function(results) {
//         let likeVideoVal = results[0].videoSpotName;
//
//         return knex('videos').where('spot_id', req.body.spot_id)
//           .update({
//             upvotes: likeVideoVal + 1
//           })
//           .then(function() {
//             knex('users').where('users.id', req.session.passport.user[0].id)
//               .join('comments', 'comments.user_id', 'users.id')
//               .join('spots', 'spots.id', 'comments.spot_id')
//               .then(function(results) {
//                 let comments;
//                 if (results) {
//                   comments = results;
//                 } else {
//                   comments = ""
//                 }
//
//                 console.log(comments, 'COMMENTS FOR THE USER PROFILE PAGE')
//
//                 knex('checkins').where('checkins.user_id', req.session.passport.user[0].id)
//                   .join('spots', 'spots.id', 'checkins.spot_id')
//                   .then(function(results) {
//                     let checkins;
//                     if (results) {
//                       checkins = results;
//                     } else {
//                       checkins = ""
//                     }
//                       var photos;
//
//                     knex ('photos').where('photos.user_id', req.session.passport.user[0].id)
//                     .join('spots', 'spots.id', 'photos.spot_id')
//                     .then(function(results){
//                       if (results) {
//                         photos = results;
//                       } else {
//                         photos = ""
//                       }
//
//                       knex('videos').where('videos.user_id', req.session.passport.user[0].id)
//                       .join('spots', 'spots.id', 'videos.spot_id')
//                       .then(function(results) {
//                         if (results) {
//                           videos = results;
//                         } else {
//                           videos = ""
//                         }
//
//
//                     console.log(results, 'CHECKINS FOR THE USER PROFILE PAGE')
//                     res.render('profile', {
//                       user: req.session.passport.user,
//                       comments: comments,
//                       checkins: checkins,
//                       photos: photos,
//                       videos: videos
//                     });
//                   })
//                 })
//               })
//               })
//
//
//
//
//           })
//
// })
//
// }

  knex('users').where('users.id', req.session.passport.user[0].id)
    .join('comments', 'comments.user_id', 'users.id')
    .join('spots', 'spots.id', 'comments.spot_id')
    .then(function(results) {
      let comments;
      if (results) {
        comments = results;
      } else {
        comments = ""
      }

      console.log(comments, 'COMMENTS FOR THE USER PROFILE PAGE')

      knex('checkins').where('checkins.user_id', req.session.passport.user[0].id)
        .join('spots', 'spots.id', 'checkins.spot_id')
        .then(function(results) {
          let checkins;
          if (results) {
            checkins = results;
          } else {
            checkins = ""
          }
            var photos;

          knex ('photos').where('photos.user_id', req.session.passport.user[0].id)
          .join('spots', 'spots.id', 'photos.spot_id')
          .then(function(results){
            if (results) {
              photos = results;
            } else {
              photos = ""
            }

            knex('videos').where('videos.user_id', req.session.passport.user[0].id)
            .join('spots', 'spots.id', 'videos.spot_id')
            .then(function(results) {
              if (results) {
                videos = results;
              } else {
                videos = ""
              }


          console.log(results, 'CHECKINS FOR THE USER PROFILE PAGE')
          res.render('profile', {
            user: req.session.passport.user,
            comments: comments,
            checkins: checkins,
            photos: photos,
            videos: videos
          });
        })
      })
    })
    })

});


/*  ====================================================================
                upload user profile picture
====================================================================  */
router.post('/profile', function(req, res) {
  console.log(req.body.url, 'HELLLOOOOOOOOOOOOOOOOOOOOOOOOOO');
  let url = req.body.url

  req.session.passport.user[0].profile_photo = url



  console.log(req.session.passport.user, 'SHOULD BE UPDATED USERRRRRRR');
  return knex('users').where('id', req.session.passport.user[0].id)
    .update('profile_photo', url)
    .then(function() {
      knex('users').where('users.id', req.session.passport.user[0].id)
        .join('comments', 'comments.user_id', 'users.id')
        .join('spots', 'spots.id', 'comments.spot_id')
        .then(function(results) {
          let comments;
          if (results) {
            comments = results;
          } else {
            comments = "";
          }

          console.log(comments, 'COMMENTS FOR THE USER PROFILE PAGE');

          knex('checkins').where('checkins.user_id', req.session.passport.user[0].id)
            .join('spots', 'spots.id', 'checkins.spot_id')
            .then(function(results) {
              let checkins;
              if (results) {
                checkins = results;
              } else {
                checkins = "";
              }
                var photos;

              knex ('photos').where('photos.user_id', req.session.passport.user[0].id)
              .join('spots', 'spots.id', 'photos.spot_id')
              .then(function(results){
                if (results) {
                  photos = results;
                } else {
                  photos = "";
                }

                knex('videos').where('videos.user_id', req.session.passport.user[0].id)
                .join('spots', 'spots.id', 'videos.spot_id')
                .then(function(results) {
                  if (results) {
                    videos = results;
                  } else {
                    videos = "";
                  }


              console.log(results, 'CHECKINS FOR THE USER PROFILE PAGE');
              res.render('profile', {
                user: req.session.passport.user,
                comments: comments,
                checkins: checkins,
                photos: photos,
                videos: videos
              });
            });
          });
        });
      });



    });





});



/*  ====================================================================
              get success after user updates profile
====================================================================  */

router.get('/success', function(req, res) {
  res.render('success')
})


/*  ====================================================================
                edit user profile page if logged in
====================================================================  */

router.post('/success', function(req, res) {
  console.log(req.body, 'WHAT IS HAPPENINGGGGGGGGGGGGG')
  return knex('users').where('users.id', req.body.id)
    .update({
      email: req.body.email,
      full_name: req.body.full_name,
      profile_photo: req.body.profile_photo
    })
    .then(function(results) {
      req.logout();
      console.log(req.session.passport, 'AFTER LOGOUT');
      res.render('success')
    })

})


/*  ====================================================================
                list all users
====================================================================  */

router.get('/list', function(req, res) {
  knex('users').whereNot('id', req.session.passport.user[0].id)
    .then(function(results) {
      res.render('list', {
        user: req.session.passport.user,
        users: results
      })

    })

})






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
