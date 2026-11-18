#!/usr/bin/env node
'use strict';

// Checks that a page load which Chromium aborts with net::ERR_NETWORK_CHANGED
// (the network of the machine changed under it: a Docker network created or
// removed, as when another DDEV project starts or stops) is loaded once more,
// with a line in the log, and that a second abort fails the step as before.
//
// A project's Before hook (written here, the way a project writes one) makes
// the page's goto() throw that error once, or twice, before it loads the
// page: the real navigation step then runs against a real page.
//
// The check serves its own page on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-network-changed.js   (npm run test:network-changed)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-network-changed-'));
const report = path.join(tmp, 'network.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'project.steps.js');
const feature = path.join(tmp, 'network.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const PAGE = '<!doctype html><html><head><title>Shop</title></head><body><h1>Shop</h1></body></html>';

fs.writeFileSync(steps, [
  `const { Before } = require(${JSON.stringify(cucumber)});`,
  "Before({ tags: '@aborted-once or @aborted-twice' }, function (scope) {",
  "  let left = scope.pickle.tags.some((tag) => tag.name === '@aborted-twice') ? 2 : 1;",
  '  const page = this.page;',
  '  const goto = page.goto.bind(page);',
  '  page.goto = async (url, options) => {',
  '    if (left > 0) {',
  '      left -= 1;',
  '      throw new Error(`page.goto: net::ERR_NETWORK_CHANGED at ${url}`);',
  '    }',
  '    return goto(url, options);',
  '  };',
  '});',
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: A page load aborted by a change of the network of the machine',
  '',
  '  @aborted-once',
  '  Scenario: The page is loaded once more',
  '    Given I am on "/"',
  '    Then I should see "Shop"',
  '',
  '  @aborted-twice',
  '  Scenario: A second abort fails the step',
  '    Given I am on "/"',
  '',
  '  Scenario: A page load that nothing aborts',
  '    Given I am on "/"',
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
  const results = {};
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(output).slice(-1500)}`);
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        const steps = (scenario.steps || []).filter((step) => !step.hidden);
        const failed = steps.find((step) => step.result && step.result.status !== 'passed');
        results[scenario.name] = failed ? { status: failed.result.status, message: strip(failed.result.error_message) } : { status: 'passed' };
      }
    }
    const once = results['The page is loaded once more'];
    const twice = results['A second abort fails the step'];
    const plain = results['A page load that nothing aborts'];
    if (!once || once.status !== 'passed') problems.push(`after one abort the page was not loaded once more: ${once ? once.message.split('\n')[0] : 'the scenario did not run'}`);
    if (!twice || twice.status !== 'failed') problems.push(`after two aborts the step did not fail: ${twice ? twice.status : 'the scenario did not run'}`);
    else if (!/Failed to navigate to/.test(twice.message) || !/ERR_NETWORK_CHANGED/.test(twice.message)) problems.push(`after two aborts the step failed with another message: ${twice.message.split('\n')[0]}`);
    if (!plain || plain.status !== 'passed') problems.push('a page load that nothing aborts did not pass');
    const lines = strip(output).split('\n').filter((line) => /net::ERR_NETWORK_CHANGED, as when a Docker network starts or stops\); loading it once more\./.test(line));
    if (lines.length !== 2) problems.push(`the log says ${lines.length} time(s) that a load was tried once more, not 2 (one per aborted scenario)`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('A page load aborted by a network change:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('A page load aborted by a network change is loaded once more and the log says so; a second abort fails the step.');
}
