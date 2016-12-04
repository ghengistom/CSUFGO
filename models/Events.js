var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
  title: String,
  time: String,
  location: String,
  contact: String,
  description: String,
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber'}]
});

mongoose.model('Event', EventSchema);
