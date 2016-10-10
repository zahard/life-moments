var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');
var easyimg = require('easyimage');

var mongoose = require('libs/connectdb');

var Photo = mongoose.models.Photo;

var config = require('libs/config');



console.log('Start'.green)

async.series([
	open,
	// /dropDatabase,
	findPhotos,
	testPhotos
], function(err, results) {
	if(err) console.log(err)

	console.log('Finished'.green)


	mongoose.disconnect();
	process.exit(err?255:0);
});


var processFile = require('crawl/imageProcessing')(mongoose);

var filesCount = 0;
function logFile()
{
	filesCount++;
	if (filesCount%10 == 0)
	{
		var str = filesCount+' file processed';
		console.log(str.yellow);
	}
}

function testPhotos(callback)
{

	Photo.find({}, function(err, photos){
		if(err) callback(err);

		console.log(photos.length)

		callback();
	})
}

function findPhotos(callback)
{

	//Lets read a dir
	var walk = function(dir, done) {

		var t = fs.readdir(dir, function(err, list){

			if (err) return done(err);

			var pending = list.length;
			if (!pending) return done();

			list.forEach(function(fileName) {
				var file = path.resolve(dir, fileName);
				fs.stat(file, function(err, stat) {
					//IF directory
		        	if (stat && stat.isDirectory()) {

		        		if (fileName == config.thumbDir)
		        		{
		        			if (!--pending) done(null);
		        			return;
		        		}

		          		walk(file, function(err) {
		            		if (!--pending) done(null);
		          		});
		        	} else {

		        		//Test correct file extension
						if (! /\.jpe?g$/i.test(file))
						{
							if (!--pending) done(null);	
						}else{
			        		processFile(file, stat, function(err){
								if (!--pending) done(null);	
			        		});
						}
		        	}
		      });

			});

		})
	}

	walk(config.source, function(err){
	  	if (err) throw err;
		callback();
	});
}


function open(callback)
{
	mongoose.connection.on('open', callback);	
}

function dropDatabase(callback)
{
	var db = mongoose.connection.db;
	console.log('Deleteing databse'.red)
	db.dropDatabase(callback);
}