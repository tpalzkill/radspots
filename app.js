const express = require('express');
const app = express();
var AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const port = process.env.PORT || 8000;
const mapRouter = require('./routes/map');
const users = require('./routes/users');
const path = require('path');
var config = require('./knexfile')['production'];
var knex = require('knex')(config);
const bcrypt = require('bcrypt-as-promised');
const passport = require('passport')
var localStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('connect-flash');


// HELP ME!
// Configure our app with our settings.

// Tell our app where to find our views.
app.set('views', './views');


// Telling our app which TEMPLATING ENGINE to use.
app.set('view engine', 'ejs');

// MARK: - Middleware

// Body parser is used for parsing the body JSON of your request to a body JS object.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); // test
app.use(cookieParser()); //read cookies (needed for auth)

// Morgan is used for logging which routes are being accessed.
app.use(morgan('short'));

//setup passport and passport sesssions

app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());  //use for flash messages stored in session


app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/map', mapRouter);
app.use('/users', users);

app.use('/', function (req, res) {
  res.render('./login');
});



//checking user/password input against info in the database
passport.use('login', new localStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
  function(req, email, password, done) {

    knex('users').where('email', email)  //find user where email = input email
    .then (function (results, err) {

      if (err) {
        return done(err);
      }
      if (!results[0].email) {
        return done(null, false, req.flash('loginMessage', 'No user found.'));
      }
      //compare hashed password in database against password entered
      bcrypt.compare(password, results[0].hashed_password)
            .then(function(results) {
              if (!results) {
                  return done(null, false, req.flash('loginMessage', 'Wrong password.'))
              }
            })

        return done(null, results);

    })

}));




//serialize user for the session -- keep them logged in
passport.serializeUser(function(user, done) {
  console.log('i am serializedddddddddddd')
  console.log(user, 'serial user')
  done(null, user);

})


passport.deserializeUser(function(id, done) {
console.log('im deserialized boooooooo')
  knex('users').where('id', id[0].id)
    .then(function(results) {
      if (results) {
        done(null, results[0].id)
      }
    })
})










// Starting the server/ telling it which port to run on.
app.listen(port, function () {
  console.log(`Listening on port: ${port}`);
});
