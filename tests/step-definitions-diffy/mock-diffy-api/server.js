'use strict';

const http = require('http');

let server = null;
const PORT = 3099;
const HOST = '127.0.0.1';

function createMockServer() {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;

      const { method, url } = req;

      // POST auth/key → bearer token
      if (method === 'POST' && url.includes('auth/key')) {
        res.end(JSON.stringify({ token: 'mock-diffy-token' }));
        return;
      }

      // POST projects/{id}/create-custom-snapshot → snapshot id
      if (method === 'POST' && url.includes('create-custom-snapshot')) {
        res.end(JSON.stringify({ id: 1 }));
        return;
      }

      // POST projects/{id}/screenshots → snapshot id
      if (method === 'POST' && url.includes('/screenshots')) {
        res.end(JSON.stringify({ id: 1 }));
        return;
      }

      // POST projects/{id}/diffs → diff id
      if (method === 'POST' && url.includes('/diffs')) {
        res.end(JSON.stringify({ id: 1 }));
        return;
      }

      // POST projects/{id}/compare → diff id
      if (method === 'POST' && url.includes('/compare')) {
        res.end(JSON.stringify({ id: 1 }));
        return;
      }

      // GET diffs/{id} → state 2 = completed
      if (method === 'GET' && url.includes('diffs/')) {
        res.end(JSON.stringify({ id: 1, state: 2 }));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'mock: not found', url }));
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, HOST, () => resolve(PORT));
    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        // Already running (leftover from previous run) — treat as success.
        server = null;
        resolve(PORT);
      } else {
        reject(err);
      }
    });
  });
}

function stopMockServer() {
  return new Promise(resolve => {
    if (server) {
      server.close(() => { server = null; resolve(); });
    } else {
      resolve();
    }
  });
}

module.exports = { createMockServer, stopMockServer, PORT, HOST };
