#!/usr/bin/env node
'use strict';

// Checks that the browser of a run keeps the same-origin policy a visitor's
// browser has: a page posts a form to its own origin with fetch, and the
// server answers it only when the request carries the page's Origin header,
// as a site's check against cross-site forms does (SvelteKit's form actions,
// Rails' default origin check). Chromium started with --disable-web-security
// sends that POST without the header, and the site refuses it with 403.
// A second scenario fills in a field of a frame from another origin: the
// browser reaches it without the flag.
//
// The check serves its own pages on two free local ports (two origins), so no
// other server is needed, and runs with this repository's own
// playwright.config.ts.
//
// Usage: node tests/check-same-origin.js   (npm run test:same-origin)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-same-origin-'));
const report = path.join(tmp, 'same-origin.json');
const config = path.join(tmp, 'cucumber.js');
const feature = path.join(tmp, 'same-origin.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const PAGE = `<!doctype html><html><head><title>Newsletter</title></head><body>
<h1>Newsletter</h1>
<form id="form"><input name="email" value="ada@example.com"><button type="submit">Subscribe</button></form>
<p id="status">Nothing yet</p>
<script>
document.getElementById('form').addEventListener('submit', function (event) {
  event.preventDefault();
  fetch('/subscribe', { method: 'POST', body: new URLSearchParams(new FormData(event.target)) })
    .then(function (r) { return r.text(); })
    .then(function (t) { document.getElementById('status').textContent = t; });
});
</script></body></html>`;

// The page of the other origin, shown in a frame of /framed.
const FRAME = `<!doctype html><html><head><title>Newsletter</title></head><body>
<label for="subscriber">Your name</label><input id="subscriber" name="subscriber_name">
<p id="greeting"></p>
<script>
document.getElementById('subscriber').addEventListener('input', function () {
  document.getElementById('greeting').textContent = 'Hello ' + this.value;
});
</script></body></html>`;

fs.writeFileSync(feature, [
  'Feature: A form posted to its own site carries the page\'s Origin',
  '',
  '  Scenario: The site answers a form posted from its own page',
  '    Given I am on "/"',
  '    When I press "Subscribe"',
  '    Then I should see "Subscribed" in the "#status" element',
  '',
  '  Scenario: A frame from another origin is reached',
  '    Given I am on "/framed"',
  '    When I switch to the iframe with title "Newsletter"',
  '    And I fill in "subscriber" with "Webship" inside the iframe',
  '    Then I should see "Hello Webship" inside the iframe',
  '',
].join('\n'));

const other = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(FRAME);
});

let seen = null;
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    const base = `http://127.0.0.1:${server.address().port}`;
    seen = req.headers.origin || '(none)';
    req.resume();
    if (req.headers.origin !== base) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Cross-site POST form submissions are forbidden');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Subscribed');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  if (req.url.split('?')[0] === '/framed') {
    res.end(`<!doctype html><html><head><title>Framed</title></head><body><h1>Framed</h1>
<iframe title="Newsletter" src="http://127.0.0.1:${other.address().port}/"></iframe></body></html>`);
    return;
  }
  res.end(PAGE);
});
other.listen(0, '127.0.0.1', () => server.listen(0, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const defaults = require(path.join(ROOT, 'cucumber.js')).default;
  const world = JSON.parse(JSON.stringify(defaults.worldParameters));
  world.launchUrl = base;
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    requireModule: defaults.requireModule,
    require: defaults.require,
    paths: [feature],
    format: [`json:${report}`],
    worldParameters: world,
  }) + ' };');
  const env = Object.assign({ SLOW_MO: '0' }, process.env, {
    LAUNCH_URL: base,
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
  });
  const run = spawn(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'pipe'],
    env,
  });
  let errors = '';
  run.stderr.on('data', (chunk) => { errors += chunk; });
  const timer = setTimeout(() => run.kill('SIGKILL'), 120000);
  run.on('exit', () => {
    clearTimeout(timer);
    server.close();
    other.close();
    finish(errors, base);
  });
}));

function finish(errors, base) {
  const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  const problems = [];
  let count = 0;
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(errors).slice(-1500)}`);
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        count += 1;
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        if (failed) problems.push(`"${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
      }
    }
  }
  if (count !== 2) problems.push(`${count} scenarios ran, not 2.`);
  if (seen !== base) problems.push(`The form's POST carried the Origin ${seen === null ? '(no POST reached the site)' : seen}, not ${base}: is Chromium started with --disable-web-security?`);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('A form posted to its own site:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log(`A form posted to its own site carries the page's Origin (${seen}), and the site answers it; a frame from another origin is reached.`);
}
