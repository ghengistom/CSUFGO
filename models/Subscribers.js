var mongoose = require('mongoose');

var SubscriberSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  Event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event'}
});

mongoose.model('Subscriber', SubscriberSchema);
