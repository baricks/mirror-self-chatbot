var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('../models/user');
var configAuth = require('./auth');

module.exports = function(passport) {

  var newUser;

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-login', new LocalStrategy({
    usernameField: 'handle',
    passReqToCallback: true,
  },
  function(req, handle, done) {
    User.findOne({ 'local.handle':  handle }, function(err, user) {
      if (err)
          return done(err);
      if (!user)
          return done(null, false, req.flash('loginMessage', 'No user found.'));
      return done(null, user);
    });
  }));

  passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    profileFields: ['id', 'email', 'first_name', 'last_name'],
  },
  function(token, refreshToken, profile, done) {
    process.nextTick(function() {
      User.findOne({ 'facebook.id': profile.id }, function(err, user) {
        if (err)
          return done(err);
        if (!newUser) {
          newUser = new User();
        }
        console.log("FACEBOOK: " + profile.id);
        newUser.facebook.id =  profile.id;
        newUser.facebook.token = token;
        // newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
        // newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

        newUser.save(function(err) {
          if (err)
            throw err;
          return done(null, newUser);
        });
      });
    });
  }));

  passport.use(new TwitterStrategy({
    consumerKey: configAuth.twitterAuth.consumerKey,
    consumerSecret: configAuth.twitterAuth.consumerSecret,
    callbackURL: configAuth.twitterAuth.callbackURL,
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function() {
      User.findOne({ 'twitter.id': profile.id }, function(err, user) {
        if (err)
          return done(err);
        if (!newUser) {
          newUser = new User();
        }
        console.log("TWITTER: " + profile.id);
        newUser.twitter.id          = profile.id;
        newUser.twitter.token       = token;
        newUser.twitter.tokenSecret = tokenSecret;
        newUser.twitter.username    = profile.username;
        newUser.twitter.displayName = profile.displayName;
        newUser.save(function(err) {
          if (err)
           throw err;
          return done(null, newUser);
        });
      });
    });
  }));

};
