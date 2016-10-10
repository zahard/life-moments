var prompt = require('prompt');
var async = require('async');
var easyimg = require('easyimage');
var mongoose = require('libs/connectdb');
 
	async.series([
		open,
		//dropDatabase,
	], function(err, results) {
		if(err) console.log(err)

		console.log('Finished'.yellow)
		mongoose.disconnect();
		process.exit(err?255:0);
	});



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