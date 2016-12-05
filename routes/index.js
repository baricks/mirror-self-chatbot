var express = require('express');
var passport = require('passport');
var configAuth = require('../config/auth');
var nlp = require('nlp_compromise');
var router = express.Router();
var Twit = require('twit');
var request = require('request');
// var FB = require('fb');
// var graph = require('fbgraph');
var fs = require('fs');
var T;

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs', { message: req.flash('loginMessage') });
});

router.get('/profile', isLoggedIn, function(req, res) {

// THE FACEBOOK STUFF //

  console.log('LOGGED INTO FACEBOOK');
  // console.log(req.user.facebook.id);
  // console.log(req.user.facebook.token);

//   FB.setAccessToken(req.user.facebook.token);
//
//   FB.api('PageName/feed', 'get', gotPage);
//
//   function gotPage(res) {
//     var posts = res.data;
//     console.log(posts);
// }

  // graph.setAccessToken(req.user.facebook.token);
  // graph.setAppSecret(req.user.facebook.tokenSecret);
  //
  // graph.batch([
  // {
  //   method: "GET",
  //   relative_url: req.user.facebook.id + "/posts"
  // }], function(err, res) {
  //   console.log(res);
  // });

  // THE TWITTER STUFF //

  console.log('LOGGED INTO TWITTER');

  T = new Twit({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token: req.user.twitter.token,
    access_token_secret: req.user.twitter.tokenSecret,
  })

  var userName = req.user.twitter.username;

  //one issue: twit limits you to 200 tweets
  T.get('statuses/user_timeline', { screen_name: userName, include_rts: 'false', count: 200 },  function (err, data, response) {

    var tweetsList = [];
    var peopleList = [];
    var placesList = [];
    var timeList = [];
    var nounList = [];
    var whyList = [];
    var howList = [];
    var thinkList = [];
    var feelList = [];

    // go through my tweets

    for (i=0; i<data.length; i++) {
      var tweeter = data[i].text;

      // CLEAN THE TWEETS
      // *****TO DO: Fix the @ clean up
      // *****TO DO: Fix the utf-8 encoding
      
      if (tweeter.includes("@")) {
        tweet = tweeter.replace(/@\S+\s/g, '');
      }

      if (tweeter.includes(".@")) {
        tweet = tweeter.replace(/.@\S+\s/g, '');
      }

      if (tweeter.includes("http")) {
        tweet = tweeter.replace(/http\S+/g, '');
      }

      console.log(tweet);

      // tweetsList.push(tweet);

      // List of people
      var person = nlp.text(tweet).people()[0];
      if (person != null) {
        var people = (person.text).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        if (people !== "I") {
          if (people !== "you") {
            peopleList.push(people);
          }
        }
      }

      // List of nouns
      var nouns = nlp.text(tweet).nouns();
      for (k=0; k<nouns.length; k++) {
        var noun = nouns[k].text
        nounList.push(noun);
      }

      // List of times
      var time = nlp.text(tweet).dates()[0];
      if (time !== undefined) {
        // console.log(place)
        var times = (time.text).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        timeList.push(times);
      }

      // List of places
      var place = nlp.text(tweet).places()[0];
      if (place !== undefined) {
        var places = (place.text).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        placesList.push(places);
      }

      // WHY?
      if (tweet.includes("because") | tweet.includes("Because") | tweet.includes("due to") | tweet.includes("explains") | tweet.includes("I don't know"))  {
        whyList.push(tweet);
      }

      // HOW?
      if (tweet.includes("by") | tweet.includes("By") | tweet.includes("in order to"))  {
        howList.push(tweet);
      }

      // THINK WORDS
      if (tweet.includes("think") | tweet.includes("thinks") | tweet.includes("thought") | tweet.includes("my idea"))  {
        thinkList.push(tweet);
      }

      // FEEL WORDS
      if (tweet.includes("feel") | tweet.includes("feels") | tweet.includes("felt") | tweet.includes("I like") | tweet.includes("I liked"))  {
        feelList.push(tweet);
      }

    }

    // console.log(timeList);
    // console.log(peopleList);
    // console.log(nounList);
    // console.log(placesList);
    // console.log(tweetsList);
})

// THE INSTAGRAM STUFF //

  // console.log('GOT INSTA USERNAME');
  // console.log(req.handle);

  res.render('profile.ejs', { user: req.user });
});

router.get('/logout', function(req, res) {
  req.logout(),
  res.redirect('/');
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/',
}));

router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/',
}));

router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/',
}));

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();
  res.redirect('/');
}
