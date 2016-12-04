var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
// adding passport
var passport = require('passport');
// securing endpoints
var jwt = require('express-jwt');

// adding mongoose

var Event = mongoose.model('Event');
var Subscriber = mongoose.model('Subscriber');
// adding passport
var User = mongoose.model('User');

// securing endpoints
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

// added a router.param to preload event objects
router.param('event', function(req, res, next, id){
  var query = Event.findById(id);

  query.exec(function (err, event){
    if (err) { return next(err); }
    if (!event) { return next(new Error('can\'t find event')); }

    req.event = event;
    return next();
  });
});

//MADE CHANGES HERE
//old version had line 36 as var query = Subscriber.findById(id);
// added a router.param to preload a subscriber from the DB
router.param('subscriber', function(req, res, next, id){
  var query = Event.findById(id);

  query.exec(function (err, subscriber){
    if (err) { return next(err); }
    if (!Subscriber) { return next(new Error('can\'t find subscriber')); }

    req.subscriber = subscriber;
    return next();
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// added a router.get to retrive the list of Events from the DB
router.get('/events', function(req, res, next) {
  Event.find(function(err, events){
    if(err){ return next(err); }

    res.json(events);
  });
});

// added router.get to retrieve a single event (UPDATED)
router.get('/events/:event', function(req, res, next) {
  req.event.populate('subscribers', function(err, event) {
    if(err) { return next(err); }

    res.json(event);
  });
});

// securing endpoints
router.post('/events', auth, function(req, res, next){
  var event = new Event(req.body);
  event.author = req.payload.username;

  event.save(function(err, event){
    if(err){ return next(err); }

    res.json(event);
  });
});

// added router.post to add subscribers
router.post('/events/:event/subscribers', auth, function(req, res, next){
  var subscriber = new Subscriber(req.body);
  subscriber.event = req.event;
  subscriber.author = req.payload.username;

  subscriber.save(function(err, subscriber){
    if (err){ return next(err); }

    req.event.subscribers.push(subscriber);
    req.event.save(function(err, event){
      if(err){ return next(err); }

      res.json(subscriber);
    });
  });
});

// added router.put to handle updating an event
router.put('/editEvent/:event', auth, function(req, res, next){
  req.event.title = req.body.title;
  req.event.time = req.body.time;
  req.event.location = req.body.location;
  req.event.contact = req.body.contact;
  req.event.description = req.body.description;
  req.event.save(function(err, event){
    if(err){ return next(err); }
  });
});

// added router.delte to delete an event
router.delete('/deleteEvent/:event', auth, function(req, res, next){
  console.log("In router.delete");
  Event.remove({_id: req.event._id}, function(err){
    if(err){
      console.log("Erorr");
    }
    else {
      console.log("Deleted");
    }
  });
});

// adding route that creates a user given a username and password
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

// adding route that authenticates user and returns token to client
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

console.log("Line 161");

// implement search function
router.post('/searchEvent', function(req, res, next){
  console.log("In Search Function");

  //collect contents user inputs from client side
  var title_searched = req.body.title;
  
  Event.findOne(req.body, function(err, titles)
  {
    console.log("Executing findOne" + titles);

    if(err)
    {
      console.log("Error" + err);
    }
    else
    {
      console.log("Found" + err );
      console.log(titles);
      res.json(titles);
    }
  });
});




module.exports = router;
