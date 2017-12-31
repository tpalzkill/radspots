'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-as-promised');
var config = require('../knexfile')['development'];
var knex = require('knex')(config);
const passport = require('passport')


router.get('/', function(req, res) {
  console.log(req.session.passport.user, 'WTF')
  res.render('index')
})


//get page only if a user is logged in
router.get('/profile', isLoggedIn, function(req, res) {
  console.log(req.session.passport.user, 'WTF')
  res.render('profile', {user: req.session.passport.user})
})

router.get('/success', isLoggedIn, function(req, res) {
  res.render('success', {user: req.session.passport.user})
})

//logout 
router.get('/logout', function(req, res) {
  req.logout();
  console.log(req.session.passport, 'AFTER LOGOUT')
  res.render('logout', {user: req.session.passport.user})
})

// get signup page
router.get('/signup', function(req, res) {
  res.render('signup')
})

// create a new user and insert into database
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



//get login page for existing users
router.get('/login', function(req, res) {
  res.render('login')
})

//if login is correct then redirect to index if not go back to login screen
router.post('/login', passport.authenticate('login', {
  successRedirect : '/users/profile',
  failureRedirect: '/login',
  failureFlash : true

}));





//route middleware to make sure user is logged in (used on index page)
function isLoggedIn(req, res, next) {

  //if user is authenitcated in the session, cowabunga
  if(req.isAuthenticated())
  console.log(req.user, 'i am authenticated')
  return next();

  // if they aren't redirect to login page
  console.log('failllll you arent logged in')
  res.redirect('/users/login')
}





module.exports = router;
