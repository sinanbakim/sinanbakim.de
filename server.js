// create server
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var app = express();
var env = require('dotenv');

// Plesk requires the PORT environment variable to be set - check if it is set
if (!process.env.PORT) {
	console.log('WWW PORT environment variable is not set preset');
	// Load environment variables from .env file
	env.configDotenv(); // Load .env file
	if (!process.env.PORT) {
		console.log('WWW PORT environment variable is not set after loading .env file - setting to default value 80');
		process.env.PORT = 80; // your original default
	} else {
		console.log('WWW PORT environment variable is set to ' + process.env.PORT + ' after loading .env file');
	}
}
process.env.PORT = parseInt(process.env.PORT);
console.log('WWW PORT environment variable is set to ' + process.env.PORT);

// Configure MIME types properly
app.use((req, res, next) => {
	if (req.url.endsWith('.css')) {
		res.setHeader('Content-Type', 'text/css');
	} else if (req.url.endsWith('.js')) {
		res.setHeader('Content-Type', 'application/javascript');
	} else if (req.url.endsWith('.json')) {
		res.setHeader('Content-Type', 'application/json');
	} else if (req.url.endsWith('.html')) {
		res.setHeader('Content-Type', 'text/html');
	}
	next();
});

// parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: ['application/json', 'application/*+json'] }));
app.use(bodyParser.text({ type: ['text/plain', 'text/html', 'text/xml', 'application/xml', 'application/rss+xml', 'application/atom+xml'] }));
app.use(bodyParser.raw());

// static
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'content')));
app.use(express.static(path.join(__dirname, 'sites')));
app.use(express.static(path.join(__dirname))); // favicon, etc.

// Route for the root path - serve the index.html file
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for favicon
app.get('/favicon.ico', function (req, res) {
	res.sendFile(path.join(__dirname, 'favicon.ico'));
});

// Start the server on the specified port
app.listen(process.env.PORT, function () {
	console.log('WWW Server started on port ' + process.env.PORT);
}).on('error', function (err) {
	console.log('Error starting WWW server: ' + err);
	// If the server fails to start, try to start it on port 8080
	if (process.env.PORT === 80) {
		process.env.PORT = 8080;
		app.listen(process.env.PORT, function () {
			console.log('WWW Server started on port ' + process.env.PORT);
		}).on('error', function (err) {
			console.log('Error starting WWW server on port 8080: ' + err);
		});
	}
});
