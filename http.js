
var slash = require('slash');
var express = require('express');
var async = require('async');
var app = express();

var mongoose = require('libs/connectdb');
//Model
var Photo = mongoose.models.Photo;

var config = require('libs/config');


app.get('/photos', function(req, res){

	var limit = parseInt(req.query.limit,10) || 50;
	var offset = parseInt(req.query.offset, 10) || 0;

	Photo
		.find({})
		.sort({createdDate:-1})
		.limit(limit)
		.skip(offset)
		.lean()
		.exec( function(err,photos){
			if(err) {
				console.log(err.message)
				res.status(500);
				return;
			}

			photos.forEach(function(photo,i){
				var nixPath = photo.path.replace(/\\/g, '/');
				photo.url = 'http://localhost:3000' + nixPath.replace(config.photoPath, '');
				var thumbNixPath = photo.thumb.replace(/\\/g, '/');
				photo.thumbUrl = 'http://localhost:3000' + thumbNixPath.replace(config.photoPath, '');

				delete photo.path;
				delete photo.thumb;
				delete photo._v;

			})

			res.send(photos);
	});

  	
});

app.get('/monthes', function(req, res){


	Photo.aggregate([
		{ '$group': {_id: {year: {"$year":"$createdDate"}, month:{"$month":"$createdDate"}}, total: { $sum: 1 } } },
		{'$sort': {"_id.year": -1, "_id.month": -1 } },

		
	], function(err, result){
		if(err) console.log(err);

		res.send(result);
	});
	

});



//Statis js css
app.use(express.static(__dirname + '/public'));

//Static photo source
app.use(express.static(config.photoPath));

app.listen(3000, function(){
	console.log('Server Runned');
});
