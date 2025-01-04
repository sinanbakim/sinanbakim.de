// create server
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require('http');
var env = require('dotenv').config();
var app = express();

if (env.error) {
	throw env.error;
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
