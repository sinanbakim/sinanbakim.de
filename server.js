// create server
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require('http');

var app = express();
var env = require('dotenv');

// Plesk requires the PORT environment variable to be set - check if it is set
if (!process.env.PORT) {
	console.log('PORT environment variable is not set preset');
	// Load environment variables from .env file
	env.configDotenv(); // Load .env file
	if (!process.env.PORT) {
		console.log('PORT environment variable is not set after loading .env file - setting to default value 3000');
		process.env.PORT = 80; // Set default port to 3000 if not set
	} else {
		console.log('PORT environment variable is set to ' + process.env.PORT + ' after loading .env file');
	}
}
process.env.PORT = parseInt(process.env.PORT); // Convert to number if it is a string (e.g. '3000')
console.log('PORT environment variable is set to ' + process.env.PORT);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(express.static(path.join(__dirname, 'assets'))); // Serve static files from the 'assets' directory
app.use(express.static(path.join(__dirname, 'content'))); // Serve static files from the 'content' directory
app.use(express.static(path.join(__dirname, 'sites'))); // Serve static files from the 'sites' directory

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'sites', 'index.html'));
});

// Start the server on the specified port
app.listen(process.env.PORT, function () {
	console.log('Server started on port ' + process.env.PORT);
}).on('error', function (err) {
	console.log('Error starting server: ' + err);
	// If the server fails to start, try to start it on port 8080
	if (process.env.PORT === 80) {
		process.env.PORT = 8080;
		app.listen(process.env.PORT, function () {
			console.log('Server started on port ' + process.env.PORT);
		}).on('error', function (err) {
			console.log('Error starting server on port 8080: ' + err);
		});
	}
});
