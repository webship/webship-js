#!/usr/bin/env node
'use strict';

// Checks that a home page which rewrites its own address while it loads (with
// history.replaceState, as Jira's dashboard does: "/" shows
// "/secure/Dashboard.jspa", with no HTTP redirect) is still the homepage for
// "Then I should be on the homepage" once "Given I am on the homepage" or
// "When I go to the homepage" has opened it, and that another page is not.
// The starter feature of `npx init-webship-js` is that pair of steps.
//
// The check serves its own pages on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-homepage-address.js   (npm run test:homepage-address)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-homepage-address-'));
const report = path.join(tmp, 'homepage.json');
const config = path.join(tmp, 'cucumber.js');
const feature = path.join(tmp, 'homepage.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const DASHBOARD = '<!doctype html><html><head><title>Dashboard</title>'
  + '<script>window.history.replaceState({}, "", "/dashboard")</script>'
  + '</head><body><h1>Dashboard</h1><a href="/about">About</a></body></html>';
const ABOUT = '<!doctype html><html><head><title>About</title></head><body><h1>About</h1></body></html>';

fs.writeFileSync(feature, [
  'Feature: A home page that rewrites its own address',
  '',
  '  Scenario: Opened by the Given step, the home page is the homepage',
  '    Given I am on the homepage',
  '    Then I should be on "/dashboard"',
  '     And I should be on the homepage',
  '',
  '  Scenario: Opened by the When step, the home page is the homepage',
  '    When I go to the homepage',
  '    Then I should be on the homepage',
  '',
  '  Scenario: Another page is not the homepage',
  '    Given I am on the homepage',
  '     When I go to "/about"',
  '     Then I should not be on the homepage',
  '',
].join('\n'));

const server = http.createServer((req, res) => {
  const page = req.url.startsWith('/about') ? ABOUT : DASHBOARD;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page);
});
server.listen(0, '127.0.0.1', () => {
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
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(output).slice(-1500)}`);
  } else {
    let count = 0;
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        count += 1;
        const steps = (scenario.steps || []).filter((step) => !step.hidden);
        const failed = steps.find((step) => step.result && step.result.status !== 'passed');
        if (failed) problems.push(`"${scenario.name}": ${failed.keyword}${failed.name} ${failed.result.status}: ${strip(failed.result.error_message).split('\n').slice(0, 3).join(' | ')}`);
      }
    }
    if (count !== 3) problems.push(`${count} scenario(s) ran, not 3`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('A home page that rewrites its own address:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('A home page that rewrites its own address is the homepage once a step has opened it; another page is not.');
}
