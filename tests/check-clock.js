#!/usr/bin/env node
'use strict';

// Runs scenarios with a fake clock (Playwright's page.clock) and checks that
// the smart waits still read the page: a navigation and a press settle in
// about the time the page needs, not their whole budget, because the
// settle no longer counts the clock's own timers nor reads the faked
// Date.now(). It also checks that advancing a clock nobody installed says
// so: Playwright installs one there and then, and the timers the page set
// before it run on real time.
//
// The check serves its own page on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-clock.js   (npm run test:clock)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-clock-'));
const report = path.join(tmp, 'clock.json');
const config = path.join(tmp, 'cucumber.js');
const feature = path.join(tmp, 'clock.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const PAGE = `<!doctype html><html><head><title>Clock</title></head><body>
<h1>A quiet page</h1>
<button id="go" type="button">Go</button>
<p id="status">Ready</p>
<script>
document.getElementById('go').addEventListener('click', function () {
  document.getElementById('status').textContent = 'Pressed';
});
</script></body></html>`;

// [scenario, its steps, the step to time (by its text), its limit in ms]
const scenarios = [
  ['A navigation with a fake clock settles when the page is quiet', [
    'Given I am on "/"',
    'And the system time is "2026-05-08T10:00:00Z"',
    'When I am on "/"',
    'Then I should see "A quiet page"',
  ], 'I am on "/"', 2000],
  ['A press with a fake clock settles when the page is quiet', [
    'Given I am on "/"',
    'And the system time is "2026-05-08T10:00:00Z"',
    'When I press "Go"',
    'Then I should see "Pressed"',
  ], 'I press "Go"', 1000],
  ['Advancing a clock nobody installed', [
    'Given I am on "/"',
    'When I advance the clock by 2 seconds',
    'Then I should see "A quiet page"',
  ], null, null],
];

fs.writeFileSync(feature, [
  'Feature: Smart waits with a fake clock',
  '',
  ...scenarios.flatMap(([name, steps]) => [`  Scenario: ${name}`, ...steps.map((s) => `    ${s}`), '']),
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
  delete env.WEBSHIP_AUTO_SETTLE;
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
  let count = 0;
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(output).slice(-1500)}`);
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        count += 1;
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        if (failed) {
          problems.push(`"${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
          continue;
        }
        const entry = scenarios.find(([name]) => name === scenario.name);
        if (!entry || !entry[2]) continue;
        const [, , text, limit] = entry;
        const timed = (scenario.steps || []).filter((step) => !step.hidden && step.name === text);
        const last = timed[timed.length - 1];
        const ms = last ? Math.round(last.result.duration / 1e6) : NaN;
        if (!(ms <= limit)) problems.push(`"${scenario.name}": "${text}" took ${ms} ms with the fake clock, more than ${limit} ms: the settle ran to its budget.`);
      }
    }
    if (count !== scenarios.length) problems.push(`${count} scenarios ran, not ${scenarios.length}.`);
  }
  if (!/The clock was not installed/.test(strip(output))) {
    problems.push('Advancing a clock nobody installed printed no note that a fake clock was installed only then.');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('Smart waits with a fake clock:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('Smart waits with a fake clock: a navigation and a press settle when the page is quiet; advancing a clock nobody installed says so.');
}
