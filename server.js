"use strict"

var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var FB = require('fb');
// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: 'abc',
    clientSecret: 'abc',
    callbackURL: 'https://coolchatbot.herokuapp.com/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    FB.setAccessToken(accessToken);
    return cb(null, profile);
  }));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

var express = require('express');
var app = express();

app.set('views', './views')
app.set('view engine', 'ejs')

var hostname

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/', function (req, res) {
  hostname = 'http://' + req.headers.host
  res.render('pages/index', { hostname: hostname, user: req.user })
});

app.get('/login',
  function(req, res){
    console.log(req.baseUrl);
    res.render('pages/login', { hostname: hostname });
  });

app.get('/login/facebook',
  passport.authenticate('facebook', { scope: ['user_friends', 'publish_actions'] }));

app.get('/login/facebook/return',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('pages/profile', { hostname: hostname, user: req.user });
  });

var chooseQuote = function(){
  var quote = ["#dogewithit", "Doge with it !", "Deal with it", "https://www.youtube.com/watch?v=Yj7ja6BANLM"];
  var i = Math.floor(Math.random() * 4);
  return quote[i];
}

app.get('/send',  function(req, res){

    var body = chooseQuote();

    FB.api('me/feed', 'post', { message: body }, function (res) {
      if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
      }
      console.log('Post Id: ' + res.id);
    });

    res.render('pages/send', { hostname: hostname, message: body });
  });

let port = process.env.PORT || 3000

app.listen(port, function () {
  console.log('Example app listening on port 3000!');
});
