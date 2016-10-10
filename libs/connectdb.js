var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/drive');


mongoose.model('Photo', { path: String, date: Date, thumb: String, album: String, ratio: Number, width: Number, height: Number});

module.exports = mongoose;