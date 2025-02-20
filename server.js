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

// Mime types
express.static.mime.define({ 'text/html': ['html'] });
express.static.mime.define({ 'text/css': ['css'] });
express.static.mime.define({ 'text/javascript': ['js'] });
express.static.mime.define({ 'application/javascript': ['js'] });
express.static.mime.define({ 'application/xml': ['xml'] });
express.static.mime.define({ 'application/rss+xml': ['rss'] });
express.static.mime.define({ 'application/atom+xml': ['atom'] });
express.static.mime.define({ 'application/json': ['json'] });
express.static.mime.define({ 'application/font-woff': ['woff'] });
express.static.mime.define({ 'application/font-woff2': ['woff2'] });
express.static.mime.define({ 'application/font-ttf': ['ttf'] });
express.static.mime.define({ 'application/font-otf': ['otf'] });
express.static.mime.define({ 'application/font-eot': ['eot'] });
express.static.mime.define({ 'application/font-sfnt': ['sfnt'] });
express.static.mime.define({ 'image/svg+xml': ['svg'] });
express.static.mime.define({ 'image/webp': ['webp'] });
express.static.mime.define({ 'image/png': ['png'] });
express.static.mime.define({ 'image/jpeg': ['jpg', 'jpeg'] });
express.static.mime.define({ 'image/gif': ['gif'] });
express.static.mime.define({ 'image/bmp': ['bmp'] });
express.static.mime.define({ 'image/tiff': ['tiff'] });
express.static.mime.define({ 'image/x-icon': ['ico'] });

app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json({ type: ['application/json', 'application/*+json'] })); // for parsing JSON and JSON-like content
app.use(bodyParser.text({ type: ['text/plain', 'text/html', 'text/xml', 'application/xml', 'application/rss+xml', 'application/atom+xml'] })); // for parsing text content
app.use(bodyParser.raw()); // for parsing application/octet-stream

// Serve static files
app.use(express.static(path.join(__dirname, 'assets'))); // Serve static files from the 'assets' directory
app.use(express.static(path.join(__dirname, 'content'))); // Serve static files from the 'content' directory
app.use(express.static(path.join(__dirname, 'sites'))); // Serve static files from the 'sites' directory

// Route for the root path - serve the index.html file
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
