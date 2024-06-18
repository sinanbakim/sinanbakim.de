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
var startPort = 3000;
var endPort = 3100;

function checkIfPortIsAvailable(port) {
    return new Promise((resolve, reject) => {
        var server = http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hello World\n');
        });

        server.on('error', function (err) {
            server.close(); // Stellen Sie sicher, dass der Server geschlossen wird, auch wenn ein Fehler auftritt
            if (err.code === 'EADDRINUSE') {
                resolve(false); // Der Port ist bereits in Gebrauch
            } else {
                reject(err); // Ein anderer Fehler tritt auf, lehnen Sie das Promise mit dem Fehler ab
            }
        });

        server.listen(port, function () {
            server.close(); // Schließen Sie den Server, nachdem erfolgreich festgestellt wurde, dass der Port frei ist
            resolve(true); // Der Port ist verfügbar
        });
    });
}

async function findAvailablePort(minPort, maxPort) {
    for (let port = minPort; port <= maxPort; port++) {
        const isAvailable = await checkIfPortIsAvailable(port);
        if (isAvailable) {
            return port;
        }
    }
    return null; // Kein verfügbarer Port gefunden
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

findAvailablePort(startPort, endPort).then((port) => {
    if (port) {
        app.listen(port, function () {
            console.log('Server started on port ' + port);
        });
    } else {
        console.log('No available port found');
    }
});
