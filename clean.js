var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');
var easyimg = require('easyimage');
var term = require('terminal-kit').terminal;
var colors = require('colors');
var mongoose = require('libs/connectdb');
var Photo = mongoose.models.Photo;
var config = require('libs/config');

var yesno = require('yesno');

console.log(colors.green('Start'));


function getPhotos(callback, limit, offset)
{	
	var missingPhotos = [];
	Photo.find({})
		.limit(limit)
		.skip(offset)
		.exec( function(err,photos){
			if(err) throw err;

			if (!photos || photos.length == 0)
			{
				callback(true, []);
				return;
			}
			
			async.eachOfLimit(photos, 4, 
				function(photo, index, done) {

					fs.stat(photo.path, function(err, stat) {
						if(err) {
							missingPhotos.push(photo._id);
						}
						done();						
					});

				},
				function() {
					console.log(photos.length+' photos compelted');
					if (missingPhotos.length)
						console.log(colors.yellow('MIssng '+missingPhotos.length+' files'))

					callback(null, missingPhotos);
				}
			);
		});
}

function searchForRemoved(callback)
{
	var limit = 1000;
	var offset = 0;	
	var toDelete = [];
	var done = function(completed, missing)
	{
		toDelete = toDelete.concat(missing);
		if (completed) 
		{
			return	callback(null, toDelete);
		}

		offset += limit;
		getPhotos(done, limit, offset);
	}

	getPhotos(done, limit, offset);

}

function cleanRemoved(toDelete, callback)
{	
	var len = toDelete.length;
	console.log(colors.red(len + ' files missing'));


	yesno.ask('Clean database record for them? y/n?', true, function(ok) {
	    if(ok)
	    {
		   	Photos.remove({ id: { $in: toDelete } }, function (err) {
		      if (err) return callback("Error while deleting " + err.message);

		      callback();
		    });     
	    }
	    else
	    {
			callback();        
	    }
	});
}

async.waterfall([
	open,
	searchForRemoved,
	cleanRemoved,
], function(err, results) {
	if(err) console.log(err)

	console.log(colors.green('Finished'));

	mongoose.disconnect();
	process.exit(err?255:0);
});


function open(callback)
{
	mongoose.connection.on('open', function(err){
		if(err) throw err;

		callback();
	});	
}

