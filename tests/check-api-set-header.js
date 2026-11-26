#!/usr/bin/env node
'use strict';

// Checks api.setHeader(name, value), the export of api.steps.js a pack's own
// step uses to set a header for the requests the API steps send after it:
// - the header reaches the server with the next request;
// - a placeholder in its value is replaced when the request is sent, so a
//   header set before the placeholder has a value gets it;
// - the same name in another letter case replaces it, and null removes it;
// - the next scenario starts without it.
//
// A project's step file (written here, the way a pack writes one) calls the
// export; the requests are the built-in API steps, sent to a local server
// that answers with the headers it received.
//
// Usage: node tests/check-api-set-header.js   (npm run test:api-set-header)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-api-set-header-'));
const report = path.join(tmp, 'headers.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'project.steps.js');
const feature = path.join(tmp, 'headers.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
const api = path.join(ROOT, 'tests', 'step-definitions', 'api.steps.js');

fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(cucumber)});`,
  `const api = require(${JSON.stringify(api)});`,
  "Given('the project sets the header {string} to {string}', function (name, value) { api.setHeader(name, value); });",
  "Given('the project removes the header {string}', function (name) { api.setHeader(name, null); });",
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: A header set by a project through api.setHeader',
  '',
  '  Background:',
  '    Given the API base URL is "/"',
  '',
  '  Scenario: The header reaches the server',
  '    Given the project sets the header "X-Check" to "one"',
  '    When I send a GET request to "/echo"',
  '    Then the JSON property "headers.x-check" should be "one"',
  '',
  '  Scenario: A placeholder in the value is replaced when the request is sent',
  '    Given the project sets the header "Authorization" to "Bearer {{token}}"',
  '    And I set placeholder "{{token}}" to "abc"',
  '    When I send a GET request to "/echo"',
  '    Then the JSON property "headers.authorization" should be "Bearer abc"',
  '',
  '  Scenario: The same name in another letter case replaces it, and null removes it',
  '    Given the project sets the header "X-Check" to "one"',
  '    And the project sets the header "x-check" to "two"',
  '    When I send a GET request to "/echo"',
  '    Then the JSON property "headers.x-check" should be "two"',
  '    And the JSON property "count" should be 1',
  '    When the project removes the header "X-CHECK"',
  '    And I send a GET request to "/echo"',
  '    Then the JSON response should not have property "headers.x-check"',
  '',
  '  Scenario: The next scenario starts without it',
  '    When I send a GET request to "/echo"',
  '    Then the JSON response should not have property "headers.x-check"',
  '    And the JSON response should not have property "headers.authorization"',
  '',
].join('\n'));

// The headers the request carried, and how many of them are X-Check.
const server = http.createServer((req, res) => {
  const count = req.rawHeaders.filter((h, i) => i % 2 === 0 && h.toLowerCase() === 'x-check').length;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ headers: req.headers, count }));
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
  const run = spawn(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  });
  let output = '';
  run.stdout.on('data', (chunk) => { output += chunk; });
  run.stderr.on('data', (chunk) => { output += chunk; });
  const timer = setTimeout(() => run.kill('SIGKILL'), 180000);
  run.on('exit', () => {
    clearTimeout(timer);
    server.close();
    finish(output);
  });
});

function finish(output) {
  const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  const problems = [];
  const expected = [
    'The header reaches the server',
    'A placeholder in the value is replaced when the request is sent',
    'The same name in another letter case replaces it, and null removes it',
    'The next scenario starts without it',
  ];
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(output).slice(-1500)}`);
  } else {
    const results = {};
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        results[scenario.name] = failed ? `${failed.keyword || ''}${failed.name || 'a hook'}: ${failed.result.status} ${strip(failed.result.error_message).split('\n')[0]}` : 'passed';
      }
    }
    for (const name of expected) {
      if (!results[name]) problems.push(`"${name}" did not run`);
      else if (results[name] !== 'passed') problems.push(`"${name}": ${results[name]}`);
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('api.setHeader:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('api.setHeader sets a header for the API steps that follow, with placeholders replaced when sent, one per name in any letter case, removed by null, and gone in the next scenario.');
}
