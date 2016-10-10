module.exports = function(mongoose)
{
	var mkdirp = require('mkdirp');
	var async = require('async');
	var fs = require('fs');
	var path = require('path');
	var easyimg = require('easyimage');
	var config = require('libs/config');
	var errors = require('libs/errors');

	var ImageExistsError = errors.ImageExistsError;

	var Photo = mongoose.models.Photo;
	//path.resolve(dir, fileName);

	function processFile(filename, stat, done)
	{

		var delim = '\\';
		var parts = filename.split(delim);
		var albumName = parts.slice(-2);
		parts.splice(-1,0, config.thumbDir);

		var thumbFile = parts.join(delim);
		var thumbDir = parts.slice(0,-1).join(delim);

		async.waterfall([
			//Check existance of thumbnail
			function(callback)
			{
				fs.exists(thumbFile, function(exists) { 

					if (exists)
					{
						easyimg.info(thumbFile).then(function(info) {
							var ratio = info.width / info.height;
							callback(null, exists, ratio)
						},
						function(err){
							callback(err);
						});
					}else{
						callback(null, exists, 0);	
					}
					
				});
			},

			//Create thumbnail if we need it
			function(exists, ratio, callback)
			{
				if (exists) {
					easyimg.info(filename).then(function(info) {
						callback(null, info, ratio)
					},
					function(err){
						callback(err);
					});
					return;
				}

				mkdirp(thumbDir, function(err) {
					if (err) return callback(err);

					easyimg.info(filename).then(
						function(info) {

							var ratio = info.width / info.height;
							var calculatedWidth = parseInt(config.thumbHeight * ratio);
							easyimg.resize({
								 src: filename,
								 dst: thumbFile,
								 height: config.thumbHeight,
								 width: calculatedWidth
							  }).then(
							  function(image) {
							  	 console.log('Thumbnail created');
							  	 var thumbRatio = image.width / image.height;
								 callback(null, info, thumbRatio);
							  },
							  function (err) {
								callback(err);
							  }
							);
							
						},
						function(err){
							callback(err);
						});
				});

			},

			//Save or update information
			function(info, ratio , callback)
			{	
				
				Photo.findOne({path:filename}, function(err, photo){

					if (err) return callback(err);

					var isNew = false;

					var width = info.width;
					var height = info.height;
					if (ratio < 1)
					{
						width = info.height;
						height = info.width;
					}

					if (!photo) {
						isNew = true;
						var photo = new Photo({
							path: filename,
							thumb: thumbFile,
							date: stat.mtime.getTime(),
							album: albumName,
							ratio: ratio,
							width: width,
							height: height
						});
						photo.save(function(err, photo) {
							if(err) return callback(err);

							callback(null, photo);
						});
					}
					else
					{
						callback(null, photo);
					}

					
				})
			}

		//File process complete
		], function(err, results){
			if (err) {
				if (err instanceof ImageExistsError) {

				}else{
					console.log(err.message);
				}
			}

			done();
		});		
	}



	return processFile;
}