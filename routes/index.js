var express = require('express');
var passport = require('passport');
var configAuth = require('../config/auth');
var nlp = require('nlp_compromise');
var rita = require('rita');
var router = express.Router();
var graph = require('fbgraph');
var Twit = require('twit');
var request = require('request');
var FB = require('fb');
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
  T.get('statuses/user_timeline', { screen_name: userName, include_rts: 'true', count: 200 },  function (err, data, response) {

    var tweetsList = [];
    var whoList = [];
    var whatList = [];
    var whenList = [];
    var whereList = [];
    var whyList = [];
    var howList = [];

    // go through my text messages

    // var contents = fs.readFileSync('./data/texts.txt', 'utf8');
    // var n = contents.split("\r\n");
    // var texts = [];
    // texts.push(n);
    // console.log(texts)

    // go through my tweets

    for (i=0; i<data.length; i++) {
      var tweeter = data[i].text;

      //remove extra symbols - RT, @handle

      if (tweeter.includes("@")) {
        if (tweeter.includes("RT")) {
          tweet = tweeter.replace(/RT\s*@\S+\s/g, '');
        } else tweet = tweeter.replace(/@\S+\s/g, '');
      }
      // console.log(tweet);

      tweetsList.push(tweet);

      // var rs = rita.RiString(tweet);
      // console.log(rs.features());

      // WHO?
      var person = nlp.text(tweet).people()[0];
      if (person != null) {
        var people = person.text;
        if (people !== "I") {
          if (people !== "you") {
            // whoList.push(people);
            console.log(people);
          }
        }
      }
      // console.log(person);

      // WHAT?
x

      // WHEN?
      var time = nlp.text(tweet).date
      whenList.push(time);

      // WHERE?
      var place = nlp.text(tweet).places()[0];
      if (place != null) {
        var places = place.text;
        whereList.push(places);
      }

      // WHY?
      if (tweet.includes("because") | tweet.includes("due to") | tweet.includes("explains") | tweet.includes("I don't know"))  {
        whyList.push(tweet);
      }

      // HOW?
      if (tweet.includes("by") | tweet.includes("By") | tweet.includes("in order to"))  {
        howList.push(tweet);
      }
    }
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
