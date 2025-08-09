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
		process.env.PORT = 80; // your original default
	} else {
		console.log('PORT environment variable is set to ' + process.env.PORT + ' after loading .env file');
	}
}
process.env.PORT = parseInt(process.env.PORT);
console.log('PORT environment variable is set to ' + process.env.PORT);

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

// parsers (keep your original)
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

/* ===========================================================
   === API for Sinja (upload/list/download/status/append) ===
   =========================================================== */

// Fixed default data dir as requested (can be overridden via env SINJA_DATA_DIR)
const DATA_DIR = process.env.SINJA_DATA_DIR ? path.resolve(process.env.SINJA_DATA_DIR) : '/var/www/vhosts/sinanbakim.de/data';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// simple API key auth (optional). Set SINJA_API_KEY in .env to enable.
const requireKey = (req, res, next) => {
	const required = process.env.SINJA_API_KEY;
	if (!required) return next(); // no key required
	const key = req.headers['x-api-key'] || req.query.key;
	if (key && key === required) return next();
	res.status(401).json({ error: 'unauthorized' });
};

// tiny helper: sanitize filename (no path traversal)
const safeName = (name) => {
	const base = path.basename(String(name || '').trim());
	if (!base) throw new Error('invalid filename');
	return base;
};

// CORS (handy if you call from other origins)
app.use('/api/', (req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	if (req.method === 'OPTIONS') return res.sendStatus(204);
	next();
});

// POST /api/upload  { filename, content, encoding? }
app.post('/api/upload', requireKey, (req, res) => {
	try {
		const filename = safeName(req.body.filename);
		const content = req.body.content ?? '';
		const enc = (req.body.encoding || 'utf8').toLowerCase();
		const allowed = ['utf8', 'utf-8', 'base64'];
		if (!allowed.includes(enc)) return res.status(400).json({ error: 'encoding must be utf8 or base64' });
		const buf = enc.startsWith('utf') ? Buffer.from(content, 'utf8') : Buffer.from(content, 'base64');
		fs.writeFileSync(path.join(DATA_DIR, filename), buf);
		return res.json({ ok: true, message: `saved ${filename}` });
	} catch (e) {
		return res.status(400).json({ ok: false, error: e.message });
	}
});

// POST /api/append { filename, content, newline? }
app.post('/api/append', requireKey, (req, res) => {
	try {
		const filename = safeName(req.body.filename);
		const content = String(req.body.content ?? '');
		const newline = req.body.newline !== false; // default true
		const filePath = path.join(DATA_DIR, filename);
		fs.appendFileSync(filePath, content + (newline ? '\n' : ''));
		return res.json({ ok: true, message: `appended ${filename}` });
	} catch (e) {
		return res.status(400).json({ ok: false, error: e.message });
	}
});

// GET /api/download/:filename
app.get('/api/download/:filename', requireKey, (req, res) => {
	try {
		const filename = safeName(req.params.filename);
		const filePath = path.join(DATA_DIR, filename);
		if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
		return res.sendFile(filePath);
	} catch (e) {
		return res.status(400).json({ ok: false, error: e.message });
	}
});

// GET /api/list
// query: pattern (glob-ish substring), ext (e.g. .md), limit
app.get('/api/list', requireKey, (req, res) => {
	const pattern = (req.query.pattern || '').toLowerCase();
	const ext = (req.query.ext || '').toLowerCase();
	const limit = Math.max(0, Math.min(parseInt(req.query.limit || '1000', 10), 5000));
	let files = fs
		.readdirSync(DATA_DIR)
		.filter((f) => {
			if (pattern && !f.toLowerCase().includes(pattern)) return false;
			if (ext && !f.toLowerCase().endsWith(ext)) return false;
			return true;
		})
		.slice(0, limit);
	return res.json({ dir: DATA_DIR, count: files.length, files });
});

// GET /api/status  (reads status_log.json if present)
app.get('/api/status', requireKey, (req, res) => {
	const p = path.join(DATA_DIR, 'status_log.json');
	if (!fs.existsSync(p)) return res.json({ phase: null, part: null, updated: null });
	try {
		const j = JSON.parse(fs.readFileSync(p, 'utf8'));
		return res.json(j);
	} catch (e) {
		return res.status(500).json({ error: 'status parse error', detail: e.message });
	}
});

// POST /api/status { phase, part, extra? }  (upsert)
app.post('/api/status', requireKey, (req, res) => {
	const p = path.join(DATA_DIR, 'status_log.json');
	const current = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
	const next = {
		...current,
		phase: req.body.phase ?? current.phase ?? null,
		part: req.body.part ?? current.part ?? null,
		extra: req.body.extra ?? current.extra ?? null,
		updated: new Date().toISOString(),
	};
	fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf8');
	return res.json({ ok: true, status: next });
});

/* ======================= end API ======================= */

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
