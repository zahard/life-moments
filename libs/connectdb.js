var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/drive');


mongoose.model('Photo', { 
	path: String, 
	date: Date,
	createdDate: Date,
	thumb: String, 
	album: String, 
	ratio: Number, 
	width: Number, 
	height: Number,
	exif: {
		Make: String,
		Model: String,
		Orientation: Number,
		DateTimeOriginal: Date,
		Flash: Number,
		FNumber: Number,
		ExposureProgramm: Number,
		FocalLength: Number,
		ExposureMode: Number,
		ExposureTime: Number,
		ISO: Number,
		gps: Object,
		ExifImageHeight: Number,
		ExifImageWidth: Number
	}

});

module.exports = mongoose;