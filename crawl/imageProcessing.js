module.exports = function(mongoose)
{
	var mkdirp = require('mkdirp');
	var async = require('async');
	var fs = require('fs');
	var path = require('path');
	var easyimg = require('easyimage');
	var config = require('libs/config');
	var errors = require('libs/errors');
	var isodate = require('isodate');

	var ExifImage = require('exif').ExifImage;

	var ImageExistsError = errors.ImageExistsError;

	var Photo = mongoose.models.Photo;
	//path.resolve(dir, fileName);

	function cleanNulls(str){
		var index = str.indexOf('\0');
		if (index != -1)
		{
			return str.substr(0, index);
		}
		return str;
	}

	function buildExif(exif)
	{
		var exifDataDefault = {
			Make: 'Unknow',
			Model: 'Unknow',
			Orientation: 1,
			DateTimeOriginal: null,
			Flash: 0,
			FNumber: 0,
			ExposureProgram: 0,
			ExposureTime: 0,
			FocalLength: 0,
			ExposureMode: 0,
			gps: {},
			ISO: 0,
			ExifImageHeight: 0,
			ExifImageWidth: 0
		};

		if(!exif) {
			return exifDataDefault;
		}

		var date = exif.exif.DateTimeOriginal;
		var iso = date.substr(0,10).replace(':','-').replace(':','-') +'T'+ date.substr(11) + 'Z';

		var dateObj;
		try{
			dateObj = isodate(iso);
		}catch(e){
			dateObj = null;
		}

		var exifDataSorted = {
			Make: cleanNulls(exif.image.Make),
			Model: cleanNulls(exif.image.Model),
			Orientation: exif.image.Orientation,
			DateTimeOriginal: dateObj,
			Flash: exif.exif.Flash,
			FNumber: exif.exif.FNumber,
			ExposureProgram: exif.exif.ExposureProgram,
			ExposureTime: exif.exif.ExposureTime,
			FocalLength: exif.exif.FocalLength,
			ExposureMode: exif.exif.ExposureMode,
			gps: exif.gps,
			ISO: exif.exif.ISO,
			ExifImageHeight: exif.exif.ExifImageHeight,
			ExifImageWidth: exif.exif.ExifImageWidth
		};

		return exifDataSorted;
	}

	var counter = 0;
	function saved(){
		counter++;
		if(counter%50==0)
		{
			console.log(counter + ' processed');
		}
	}


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
			//Read exif
			function(info, ratio , callback)
			{	

				new ExifImage({ image : filename }, function (err, exif) {
			        
			        var exifData = buildExif(exif);

			        callback(null, info, ratio, exifData);
			    });
			},

			//Save or update information
			function(info, ratio , exifData, callback)
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

						//If no exif date about creation
						//ue file general data
						if (!exifData.DateTimeOriginal) {
							exifData.DateTimeOriginal = stat.mtime.getTime();
						}
						

						var photo = new Photo({
							path: filename,
							thumb: thumbFile,
							date: stat.mtime.getTime(),
							createdDate: exifData.DateTimeOriginal,
							album: albumName,
							ratio: ratio,
							width: width,
							height: height,
							exif: exifData
						});
						photo.save(function(err, photo) {
							if(err) return callback(err);

							saved();
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