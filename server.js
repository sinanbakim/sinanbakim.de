// create server
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require('http');

var app = express();
var env = require('dotenv');

// Load environment variables from .env file
env.configDotenv(); // Load .env file

// Plesk requires the PORT environment variable to be set - check if it is set
if (!process.env.PORT) {
	console.log('PORT environment variable is not set');
} else {


// activate logging if needed
if (process.env.LOGGING === 'true') {
	app.use(function (req, res, next) {
		console.log(req.method + ' ' + req.url);
		next();
	});
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/test', function (req, res) {
	res.send('Hello World');
});
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT, function () {
	console.log('Server started on port ' + process.env.PORT);
});
