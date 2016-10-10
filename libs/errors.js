var util = require('util');
var http = require('http');

function ImageExistsError(message)
{
	Error.apply(this,arguments);
	Error.captureStackTrace(this, ImageExistsError);
	this.message = message || "Unknow error";
}

util.inherits(ImageExistsError, Error);
ImageExistsError.prototype.name = 'ImageExistsError';

module.exports.ImageExistsError = ImageExistsError;