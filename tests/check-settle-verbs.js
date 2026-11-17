#!/usr/bin/env node
'use strict';

// Runs a project's own steps (written here, the way a project writes them)
// whose words carry a page-changing verb — add, log out, enter, open,
// delete, save — and checks that the settle after the step waited for the
// page: the next step reads the element once and finds the change that
// arrives 600 ms after the action. A built-in assertion whose quoted text
// holds such a word ("Then I should see "Delete"") gets no settle.
//
// The check serves its own page on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-settle-verbs.js   (npm run test:settle-verbs)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-settle-verbs-'));
const report = path.join(tmp, 'settle.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'project.steps.js');
const feature = path.join(tmp, 'settle.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const PAGE = `<!doctype html><html><head><title>Shop</title></head><body>
<h1>Shop</h1>
<button id="act" type="button">Act</button>
<p id="status">Nothing yet</p>
<p>Delete</p>
<script>
document.getElementById('act').addEventListener('click', function () {
  setTimeout(function () { document.getElementById('status').textContent = 'Done'; }, 600);
});
</script></body></html>`;

// A project's own steps: each one clicks the button the way a custom step
// would, without waiting for anything.
const phrases = [
  'I add "Laptop" to the cart',
  'I log out of the shop',
  'I enter the 2FA code "123456"',
  'I open the account menu',
  'I delete the draft',
  'I save the order',
];
fs.writeFileSync(steps, [
  `const { When } = require(${JSON.stringify(cucumber)});`,
  ...phrases.map((p) => {
    const args = (p.match(/"[^"]*"/g) || []).map((_, i) => `value${i}`).join(', ');
    return `When(${JSON.stringify(p.replace(/"[^"]*"/g, '{string}'))}, async function (${args}) { await this.page.click('#act'); });`;
  }),
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: A project step that changes the page is followed by the settle',
  '',
  ...phrases.flatMap((p) => [
    `  Scenario: ${p}`,
    '    Given I am on "/"',
    `    When ${p}`,
    '    Then I should see "Done" in the "#status" element',
    '',
  ]),
  '  Scenario: A wait for AJAX in lower case',
  '    Given I am on "/"',
  '    When I wait for ajax to finish',
  '    Then I should see "Shop"',
  '',
].join('\n'));

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});
server.listen(0, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${server.address().port}`;
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
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
  });
  delete env.WEBSHIP_AUTO_SETTLE;
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
    problems.push(`The run wrote no report.\n${strip(errors).slice(-1500)}`);
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        count += 1;
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        if (failed) problems.push(`"${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
      }
    }
    if (count !== phrases.length + 1) problems.push(`${count} scenarios ran, not ${phrases.length + 1}.`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('The settle after a project step:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('The settle after a project step: every page-changing verb waits for the page; the AJAX wait reads in lower case.');
}
