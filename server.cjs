/**
 * Universal Production Node Server for Datastraw CX Copilot
 * Suitable for Render, Railway, Fly.io, Heroku, Docker, or any Node.js hosting platform.
 * Serves Vite production build ('dist/') and securely proxies '/api/gemini' to Google Gemini.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Basic .env parser if running locally without environment injection
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  // 1. Handle Gemini API Proxy
  if (req.url && req.url.startsWith('/api/gemini')) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 405, message: 'Method Not Allowed' } }));
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            code: 500,
            message: 'GEMINI_API_KEY is not configured on the production server. Please check your environment variables.'
          }
        })
      );
      return;
    }

    const cleanPath = req.url.replace(/^\/api\/gemini\/?/, '').split('?')[0] || 'models/gemini-2.5-flash:generateContent';
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${cleanPath}?key=${apiKey.trim()}`;

    // Collect body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    try {
      const upstreamRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json'
        },
        body: bodyBuffer
      });

      const resData = await upstreamRes.text();
      res.writeHead(upstreamRes.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      // Safety redaction of key if reflected
      const safeData = resData.replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]');
      res.end(safeData);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            code: 502,
            message: `Gateway error contacting Gemini API: ${err?.message || 'Network failure'}`
          }
        })
      );
    }
    return;
  }

  // 2. Serve static files from 'dist/'
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA Fallback: serve dist/index.html for any client route
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, data) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Build not found. Please run "npm run build" first.');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`✓ Datastraw CX Copilot production server listening on http://localhost:${PORT}`);
});
