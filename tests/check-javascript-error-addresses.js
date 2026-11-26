#!/usr/bin/env node
'use strict';

// Checks that the JavaScript-error capture keeps the address a console
// message came from, so a pattern can name one resource: a page whose build
// does not ship the favicon its index.html links (/vite.svg) logs the same
// text for that 404 as for any other, "Failed to load resource: the server
// responded with a status of 404 (Not Found)".
//
// - With `ignore` naming /vite.svg by its address, in "fail" mode, a page that
//   misses only /vite.svg passes, and a page that misses /other.svg still
//   fails, its report printing the address.
// - `JavaScript errors should not match "…"` reads the address too.
// - A pattern that names only the text drops the entries as before.
//
// The check serves its own pages on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-javascript-error-addresses.js   (npm run test:js-error-addresses)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-error-addresses-'));
const steps = path.join(tmp, 'project.steps.js');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const page = (images) => `<!doctype html><html><head><title>Shop</title></head><body><h1>Shop</h1>${images.map((src) => `<img src="${src}" alt="">`).join('')}</body></html>`;
const PAGES = { '/vite-page': page(['/vite.svg']), '/other-page': page(['/other.svg']), '/both-page': page(['/vite.svg', '/other.svg']) };

// The console message of a failed image can come a moment after the load.
fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(cucumber)});`,
  "Given('the page has settled', async function () { await this.page.waitForTimeout(400); });",
  '',
].join('\n'));

const runs = [
  {
    name: 'exact',
    ignore: (base) => `\\(Not Found\\) @ ${base.replace(/\./g, '\\.')}/vite\\.svg$`,
    feature: [
      'Feature: A known missing file let through by its address',
      '',
      '  Scenario: A page that misses only the known file',
      '    Given I am on "/vite-page"',
      '    And the page has settled',
      '',
      '  Scenario: A page that misses another file',
      '    Given I am on "/other-page"',
      '    And the page has settled',
      '',
      '  Scenario: The pattern step reads the address',
      '    Given I am on "/other-page"',
      '    And the page has settled',
      '    Then JavaScript errors should not match "/other\\.svg$"',
      '',
    ],
  },
  {
    name: 'text',
    ignore: () => '^Failed to load resource',
    feature: [
      'Feature: A pattern that names only the text',
      '',
      '  Scenario: Both missing files dropped by their text',
      '    Given I am on "/both-page"',
      '    And the page has settled',
      '',
    ],
  },
];

const server = http.createServer((req, res) => {
  const body = PAGES[req.url];
  if (body) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(body); return; }
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function runOne(base, run) {
  const report = path.join(tmp, `${run.name}.json`);
  const config = path.join(tmp, `${run.name}.cucumber.js`);
  const feature = path.join(tmp, `${run.name}.feature`);
  fs.writeFileSync(feature, run.feature.join('\n'));
  const defaults = require(path.join(ROOT, 'cucumber.js')).default;
  const world = JSON.parse(JSON.stringify(defaults.worldParameters));
  world.launchUrl = base;
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    requireModule: defaults.requireModule,
    require: defaults.require.concat([steps]),
    paths: [feature],
    format: [`json:${report}`],
    worldParameters: world,
  }) + ' };');
  const env = Object.assign({ SLOW_MO: '0' }, process.env, {
    LAUNCH_URL: base,
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
    WEBSHIP_JS_ERROR_MODE: 'fail',
    WEBSHIP_JS_ERROR_LEVELS: 'error',
    WEBSHIP_JS_ERROR_IGNORE: run.ignore(base),
  });
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    const timer = setTimeout(() => child.kill('SIGKILL'), 180000);
    child.on('exit', () => { clearTimeout(timer); resolve({ report, output }); });
  });
}

// name → { step: the status of its last visible step, after: the status of its After hooks, message: their texts }
function results(report) {
  const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  const out = {};
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) return null;
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) {
      const visible = (scenario.steps || []).filter((s) => !s.hidden);
      const failed = visible.find((s) => s.result && s.result.status !== 'passed');
      const hooks = (scenario.steps || []).filter((s) => s.hidden && s.keyword === 'After');
      const hookFailed = hooks.find((h) => h.result && h.result.status === 'failed');
      out[scenario.name] = {
        step: failed ? failed.result.status : 'passed',
        stepMessage: failed ? strip(failed.result.error_message) : '',
        after: hookFailed ? 'failed' : 'passed',
        afterMessage: hookFailed ? strip(hookFailed.result.error_message) : '',
      };
    }
  }
  return out;
}

server.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const problems = [];
  const exact = await runOne(base, runs[0]);
  const text = await runOne(base, runs[1]);
  server.close();
  const a = results(exact.report);
  const b = results(text.report);
  if (!a) problems.push(`The first run wrote no report.\n${exact.output.slice(-1500)}`);
  if (!b) problems.push(`The second run wrote no report.\n${text.output.slice(-1500)}`);
  if (a) {
    const known = a['A page that misses only the known file'];
    const other = a['A page that misses another file'];
    const step = a['The pattern step reads the address'];
    if (!known || known.step !== 'passed' || known.after !== 'passed') problems.push(`the page that misses only /vite.svg did not pass in fail mode: ${known ? (known.afterMessage || known.stepMessage).split('\n').slice(0, 3).join(' ') : 'it did not run'}`);
    if (!other || other.after !== 'failed') problems.push(`the page that misses /other.svg did not fail at the end of the scenario: ${other ? other.after : 'it did not run'}`);
    else if (!other.afterMessage.includes(`@ ${base}/other.svg`)) problems.push(`the report of the page that misses /other.svg does not print its address: ${other.afterMessage.split('\n').slice(0, 3).join(' ')}`);
    else if (other.afterMessage.includes('vite.svg')) problems.push('the report of the page that misses /other.svg names /vite.svg');
    if (!step || step.step !== 'failed') problems.push(`"JavaScript errors should not match" did not read the address: ${step ? step.step : 'it did not run'}`);
    else if (!step.stepMessage.includes(`@ ${base}/other.svg`)) problems.push(`"JavaScript errors should not match" failed without the address: ${step.stepMessage.split('\n').slice(0, 3).join(' ')}`);
    if (step && step.after !== 'passed') problems.push('the end-of-scenario report failed after the pattern step had handled the errors');
  }
  if (b) {
    const both = b['Both missing files dropped by their text'];
    if (!both || both.step !== 'passed' || both.after !== 'passed') problems.push(`a pattern that names only the text no longer drops the entries: ${both ? (both.afterMessage || both.stepMessage).split('\n').slice(0, 3).join(' ') : 'it did not run'}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('The addresses of console messages in the JavaScript-error capture:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('A known missing file is let through by its address, another still fails with its address in the report, the pattern step reads the address, and a pattern on the text matches as before.');
});
