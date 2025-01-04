// create server
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require('http');

var env = require('dotenv').config();
var app = express();

// check if .env file is present
if (env.error && env.error.code === 'ENOENT') {
	console.log('No .env file found, using environment variables');
} else {
	console.log('Using .env file');
}

// check if there was an error reading the .env file
if (env.error) {
	throw env.error;
}

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
