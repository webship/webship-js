#!/usr/bin/env node
'use strict';

// Runs scenarios in which a step replaces the browser context — restoring an
// auth state, starting and stopping a video recording — and checks that the
// new page keeps what the scenario had set up: the viewport of the @mobile
// tag, the smart-wait probes of the init script (a pending timer is counted),
// JavaScript-error capture, a running request log, the cookies, and video
// recording while it is on.
//
// The check serves its own page on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-context.js   (npm run test:context)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-context-'));
const report = path.join(tmp, 'context.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'context.steps.js');
const feature = path.join(tmp, 'context.feature');
const state = path.join(tmp, 'auth', 'state.json');
const videos = path.join(tmp, 'videos');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const PAGE = `<!doctype html><html><head><title>Context</title></head><body>
<h1>A page in a new browser context</h1>
<button id="boom" type="button">Boom</button>
<script>
document.getElementById('boom').addEventListener('click', function () {
  throw new Error('Boom in the new browser context');
});
</script></body></html>`;

fs.writeFileSync(steps, [
  `const { Given, When, Then } = require(${JSON.stringify(cucumber)});`,
  "Given('the cookie {string} is {string}', async function (name, value) {",
  '  await this.context.addCookies([{ name, value, url: this.launchUrl }]);',
  '});',
  "When('the page fetches {string}', async function (url) {",
  '  await this.page.evaluate((u) => fetch(u).then((r) => r.text()), url);',
  '});',
  "Then('the window should be {int} by {int}', async function (width, height) {",
  '  const size = await this.page.evaluate(() => `${window.innerWidth} by ${window.innerHeight}`);',
  '  if (size !== `${width} by ${height}`) throw new Error(`The window is ${size}.`);',
  '});',
  "Then('the smart waits should count a pending timer', async function () {",
  '  const pending = await this.page.evaluate(() => { setTimeout(() => {}, 3000); return window.__webshipPendingTimers; });',
  '  if (!(pending >= 1)) throw new Error(`The pending-timer counter reads ${pending}: the init script of the smart waits is not on this page.`);',
  '});',
  "Then('{int} JavaScript error(s) should have been captured', function (count) {",
  '  const found = (this._jsErrors || []).length;',
  '  if (found !== count) throw new Error(`${found} JavaScript error(s) were captured, not ${count}.`);',
  '});',
  "Then('the cookie {string} should still be {string}', async function (name, value) {",
  '  const cookie = (await this.context.cookies()).find((c) => c.name === name);',
  '  if (!cookie || cookie.value !== value) throw new Error(`The cookie "${name}" is ${cookie ? `"${cookie.value}"` : "gone"}.`);',
  '});',
  "Then('the page should be recording a video', function () {",
  "  if (!this.page.video()) throw new Error('The page records no video.');",
  '});',
  "Then('the page should not be recording a video', function () {",
  "  if (this.page.video()) throw new Error('The page still records a video.');",
  '});',
  '',
].join('\n'));

const restore = [
  '    Given I am on "/"',
  '    And the cookie "session" is "kept"',
  `    And I save the auth state to "${state}"`,
  '    And I start recording network requests',
  `    When I restore the auth state from "${state}"`,
  '    And I am on "/"',
];
const start = [
  '    Given I am on "/"',
  '    And the cookie "session" is "kept"',
  '    And I start recording network requests',
  '    When I start video recording',
  '    And I am on "/"',
];
const scenarios = [
  ['@mobile', 'Restoring an auth state keeps the viewport of the tag', restore, [
    '    Then the window should be 375 by 667',
  ]],
  ['', 'Restoring an auth state keeps the smart waits', restore, [
    '    Then the smart waits should count a pending timer',
  ]],
  ['', 'Restoring an auth state keeps JavaScript-error capture', restore, [
    '    When I press "Boom"',
    '    Then 1 JavaScript error should have been captured',
  ]],
  ['', 'Restoring an auth state keeps the request log', restore, [
    '    When the page fetches "/api"',
    '    Then a GET request to "*/api" should have been made',
  ]],
  ['@mobile', 'Starting a video recording keeps the viewport of the tag', start, [
    '    Then the page should be recording a video',
    '    And the window should be 375 by 667',
  ]],
  ['', 'Starting a video recording keeps the cookies and JavaScript-error capture', start, [
    '    Then the cookie "session" should still be "kept"',
    '    When I press "Boom"',
    '    Then 1 JavaScript error should have been captured',
  ]],
  ['@mobile', 'Stopping a video recording keeps the viewport, the cookies, the request log and JavaScript-error capture', start, [
    '    When I stop video recording',
    '    And I am on "/"',
    '    Then the page should not be recording a video',
    '    And the window should be 375 by 667',
    '    And the smart waits should count a pending timer',
    '    And the cookie "session" should still be "kept"',
    '    When the page fetches "/api"',
    '    Then a GET request to "*/api" should have been made',
    '    When I press "Boom"',
    '    Then 1 JavaScript error should have been captured',
  ]],
];
fs.writeFileSync(feature, [
  'Feature: A step that replaces the browser context keeps what the scenario set up',
  '',
  ...scenarios.flatMap(([tag, name, given, then]) => [
    ...(tag ? [`  ${tag}`] : []),
    `  Scenario: ${name}`,
    ...given,
    ...then,
    '',
  ]),
].join('\n'));

const server = http.createServer((req, res) => {
  if (req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

server.listen(0, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const defaults = require(path.join(ROOT, 'cucumber.js')).default;
  const world = JSON.parse(JSON.stringify(defaults.worldParameters));
  world.launchUrl = base;
  world.video = Object.assign({}, world.video, { mode: 'off', dir: videos });
  world.javascript = Object.assign({}, world.javascript, { mode: 'warn', levels: ['error'] });
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
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
  });
  delete env.WEBSHIP_VIDEO;
  delete env.WEBSHIP_VIDEO_DIR;
  delete env.WEBSHIP_JS_ERROR_MODE;
  const run = spawn(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'pipe'],
    env,
  });
  let errors = '';
  run.stderr.on('data', (chunk) => { errors += chunk; });
  const timer = setTimeout(() => run.kill('SIGKILL'), 180000);
  run.on('exit', () => {
    clearTimeout(timer);
    server.close();
    finish(errors);
  });
});

function finish(errors) {
  const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  const problems = [];
  let count = 0;
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push('The run wrote no report: cucumber-js did not start or was stopped.');
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        count += 1;
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        if (failed) {
          problems.push(`"${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
        }
      }
    }
    if (count !== scenarios.length) problems.push(`${count} scenarios ran, not ${scenarios.length}.`);
  }
  const leftovers = fs.existsSync(videos) ? fs.readdirSync(videos) : [];
  const orphans = leftovers.filter((name) => /^page@/.test(name));
  if (orphans.length) problems.push(`Video files left without their final name: ${orphans.join(', ')}.`);

  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    if (!count) process.stderr.write(errors);
    console.error('A replaced browser context:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('A replaced browser context keeps the viewport, the smart waits, the cookies, JavaScript-error capture, the request log and video recording.');
}
