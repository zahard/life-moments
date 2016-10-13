var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');
var easyimg = require('easyimage');
var colors = require('colors');
var mongoose = require('libs/connectdb');
var config = require('libs/config');
var processFile = require('search/imageProcessing')(mongoose);

var Photo = mongoose.models.Photo;

console.log(colors.green('Start'));

async.series([
	open,
	parseSource,
	testPhotos
], function(err, results) {
	if(err) console.log(err)

	console.log(colors.green('Finised'));


	mongoose.disconnect();
	process.exit(err?255:0);
});


function parseSource(callback)
{	

	readDir(config.source, 0, function(err){
		if(err) throw err;

		callback();
	});

}

function readDir(dir, level, done)
{

	var levelPadding = '';
	for(var i =0;i<level;i++){
		levelPadding += '   ';
	}

	console.log(colors.cyan( levelPadding + dir ));

	var  files = fs.readdirSync(dir);

	//Images to process with multi treds
	var images = [];

	//Directories with is one by one
	var directories = [];

	//Read one at time to keep order
	async.eachOfLimit(files, 1, 
		function(filename, idx, callback)
		{
			var file = path.resolve(dir, filename);


			fs.stat(file, function(err, stat) {
				//IF directory

				if (err) return callback();

				//If is directory
	        	if (stat.isDirectory()) {

	        		//Skip thumb directory
	        		if (filename == config.thumbDir) {
	        			callback();
	        			return;
	        		}

	        		//Add to directories
	        		directories.push({
	        			file:file, 
	        			stat:stat
	        		});
	        	}
	        	else
	        	{

	        		//Test correct file extension
					if (! /\.jpe?g$/i.test(file))
					{
						callback();
						return 
					}
					else
					{
						//Add to images
						images.push({
							file:file, 
	        				stat:stat
						});
					}
	        	}
	        	callback();
	      });

		}, 
		//Compelte
		function()
		{
			processDirectories();
		}
	);


	function processDirectories()
	{
		async.eachOfLimit(directories, 1,
			function(info, idx, callback)
			{
				//Ready child dir, and only after continnue
          		readDir(info.file, level +1, function(err){
          			if(err) callback(err);

          			callback()
          		});
			},
			function()
			{
				processFiles();	
			});
	}

	function processFiles()
	{
		async.eachOfLimit(images, 4,
			function(info, idx, callback)
			{
				processFile(info.file, info.stat, function(){
					callback(null);
        		});
			},
			function()
			{
				console.log(levelPadding+images.length+' files');
				done();
			});
	}
}

function testPhotos(callback)
{

	Photo.find({}, function(err, photos){
		if(err) callback(err);

		console.log(colors.green.bold(photos.length+' photos in database'));

		callback();
	})
}



function open(callback)
{
	mongoose.connection.on('open', callback);	
}
