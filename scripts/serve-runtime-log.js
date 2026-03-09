#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9999;
const LOG_FILE = path.join(__dirname, '..', 'devcontext', 'latest-runtime-log.txt');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const dir = path.dirname(LOG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const header =
          '# Runtime log — ' + new Date().toISOString() + '\n# Capturado desde app\n---\n';
        fs.writeFileSync(LOG_FILE, header + body, 'utf8');
        res.writeHead(200, CORS);
        res.end('OK');
      } catch (e) {
        res.writeHead(500, CORS);
        res.end(String(e));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log('[serve-runtime-log] Listening on http://localhost:' + PORT);
});
