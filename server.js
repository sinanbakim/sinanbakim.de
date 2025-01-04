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
		process.env.PORT = 3000; // Set default port to 3000 if not set
	} else {
		console.log('PORT environment variable is set to ' + process.env.PORT + ' after loading .env file');
	}
}
process.env.PORT = parseInt(process.env.PORT); // Convert to number if it is a string (e.g. '3000')
console.log('PORT environment variable is set to ' + process.env.PORT);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Middleware to log all requests to the console
app.use(function (req, res, next) {
	console.log('Time:', Date.now());
	next();
});
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'node_modules'))); // Serve static files from the 'node_modules' directory

// Routes for Web App (HTML pages)
app.get('/test', function (req, res) {
	res.send('Hello World');
});

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'index.html'));
});

// Routes for our API (not HTML)
app.get('/api', function (req, res) {
	res.send('API is running');
});

app.get('/api/echo', function (req, res) {
	res.json(req.query);
});

app.listen(process.env.PORT, function () {
	console.log('Server started on port ' + process.env.PORT);
});
