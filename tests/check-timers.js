#!/usr/bin/env node
'use strict';

// Checks that the settle of a step waits for the timers due within its budget
// and only those: a page whose app sets a one-hour setTimeout (SvelteKit 3
// polls /_app/version.json from one) settles as soon as it is quiet, a
// 300 ms timer that changes the page is still waited for, and an interval
// (60 s, or a ticker of 1 s) never holds a step, as an interval never drains.
//
// The check serves its own pages on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-timers.js   (npm run test:timers)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-timers-'));
const report = path.join(tmp, 'timers.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'project.steps.js');
const feature = path.join(tmp, 'timers.feature');
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

const page = (title, script) => `<!doctype html><html><head><title>${title}</title></head><body>
<h1>${title}</h1>
<p id="status">Nothing yet</p>
<script>${script}</script></body></html>`;

const PAGES = {
  // An app's update check, an hour away.
  '/hour': page('An hourly check', 'setTimeout(function () { document.getElementById("status").textContent = "Checked"; }, 3600000);'),
  // A change of the page 300 ms after it loads.
  '/short': page('A short timer', 'setTimeout(function () { document.getElementById("status").textContent = "Done"; }, 300);'),
  // An interval of a minute.
  '/interval': page('A slow interval', 'setInterval(function () { document.getElementById("status").textContent = "Tick"; }, 60000);'),
  // A ticker that changes nothing the step waits for.
  '/ticker': page('A ticker', 'setInterval(function () { window.ticks = (window.ticks || 0) + 1; }, 1000);'),
};

// A project's own step that reads the page once, without waiting: it passes
// only when the settle before it waited for the change.
fs.writeFileSync(steps, [
  `const { Then } = require(${JSON.stringify(cucumber)});`,
  "Then('the status should already read {string}', async function (text) {",
  "  const now = await this.page.textContent('#status');",
  '  if (now !== text) throw new Error(`The status reads "${now}", not "${text}": the settle did not wait for the timer.`);',
  '});',
  '',
].join('\n'));

const SCENARIOS = [
  { name: 'A one-hour timer does not hold the page', lines: ['Given I am on "/hour"', 'Then the status should already read "Nothing yet"'], fast: 'Given I am on "/hour"' },
  { name: 'The wait for pending timers leaves a one-hour timer', lines: ['Given I am on "/hour"', 'When I wait until pending timers settle'], fast: 'When I wait until pending timers settle', within: 1000 },
  { name: 'A 300 ms timer is waited for', lines: ['Given I am on "/short"', 'Then the status should already read "Done"'] },
  { name: 'An interval of a minute does not hold the page', lines: ['Given I am on "/interval"', 'Then the status should already read "Nothing yet"'], fast: 'Given I am on "/interval"' },
  { name: 'A ticker does not hold the page', lines: ['Given I am on "/ticker"'], fast: 'Given I am on "/ticker"' },
];
// The settle's budget is 10 s: a page that waited for its far timer or its
// interval took all of it. A quiet page settles in about a second.
const FAST_MS = 3000;

fs.writeFileSync(feature, [
  'Feature: The settle waits for the timers due within its budget, and only those',
  '',
  ...SCENARIOS.flatMap((s) => [`  Scenario: ${s.name}`, ...s.lines.map((l) => `    ${l}`), '']),
].join('\n'));

const server = http.createServer((req, res) => {
  const body = PAGES[req.url.split('?')[0]] || PAGES['/hour'];
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
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
  const times = [];
  let count = 0;
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(errors).slice(-1500)}`);
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        count += 1;
        const wanted = SCENARIOS.find((s) => s.name === scenario.name) || {};
        const visible = (scenario.steps || []).filter((step) => !step.hidden);
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        if (failed) {
          problems.push(`"${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
          continue;
        }
        if (wanted.fast) {
          const step = visible.find((s) => `${s.keyword}${s.name}`.trim() === wanted.fast);
          const ms = step ? Math.round(step.result.duration / 1e6) : NaN;
          const limit = wanted.within || FAST_MS;
          times.push(`${wanted.fast.replace(/^\w+ /, '')}: ${ms} ms`);
          if (!(ms < limit)) problems.push(`"${scenario.name}": "${wanted.fast}" took ${ms} ms, not under ${limit} ms: a far-off timer or an interval held the settle.`);
        }
      }
    }
    if (count !== SCENARIOS.length) problems.push(`${count} scenarios ran, not ${SCENARIOS.length}.`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('The settle and the timers of a page:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log(`  ${times.join('; ')}`);
  console.log('The settle waits for a 300 ms timer, and neither a one-hour timer nor an interval holds a step.');
}
