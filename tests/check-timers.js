#!/usr/bin/env node
'use strict';

// Checks that the settle of a step waits for the timers due within its budget
// and only those: a page whose app sets a one-hour setTimeout (SvelteKit 3
// polls /_app/version.json from one) settles as soon as it is quiet, a
// 300 ms timer that changes the page is still waited for, and so is one of
// 2 seconds (network idle alone waits 500 ms: past it, only the count of
// timers holds the step), and an interval (60 s, or a ticker of 1 s) never
// holds a step, as an interval never drains. A timer given a string of code
// runs, as in a browser without webship-js.
//
// The scenarios run three times: once as they are, and twice with Node's
// clock an hour ahead of the page's and an hour behind it, as a browser on
// another machine may keep another time. The deadline of a wait is set in
// Node's time and moved into the page's, which keeps the due times.
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
  // A timer given a string of code, which the browser runs as a script (it is not counted).
  '/string': page('A timer of code', 'setTimeout("document.getElementById(\\"status\\").textContent = \\"Done\\"", 100);'),
  // A change of the page 2 seconds after it loads: past network idle, only the count of timers holds the step.
  '/later': page('A later timer', 'setTimeout(function () { document.getElementById("status").textContent = "Done"; }, 2000);'),
  // An interval of a minute.
  '/interval': page('A slow interval', 'setInterval(function () { document.getElementById("status").textContent = "Tick"; }, 60000);'),
  // A ticker that changes nothing the step waits for.
  '/ticker': page('A ticker', 'setInterval(function () { window.ticks = (window.ticks || 0) + 1; }, 1000);'),
};

// A project's own step that reads the page once, without waiting: it passes
// only when the settle before it waited for the change.
fs.writeFileSync(steps, [
  '// A browser whose clock is not Node\'s (one on another machine): this run\'s Node clock moved by NODE_CLOCK_OFFSET ms.',
  "const offset = Number(process.env.NODE_CLOCK_OFFSET || 0);",
  'if (offset) { const realNow = Date.now; Date.now = () => realNow() + offset; }',
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
  { name: 'A timer of 2 seconds is waited for', lines: ['Given I am on "/later"', 'Then the status should already read "Done"'] },
  { name: 'A timer given a string of code runs', lines: ['Given I am on "/string"', 'Then the status should already read "Done"'] },
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
// The three runs: Node's clock as it is, an hour ahead of the page's, an hour behind it.
const PASSES = [
  { label: "Node's clock and the page's agree", offset: 0 },
  { label: "Node's clock an hour ahead of the page's", offset: 3600000 },
  { label: "Node's clock an hour behind the page's", offset: -3600000 },
];

server.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const defaults = require(path.join(ROOT, 'cucumber.js')).default;
  const world = JSON.parse(JSON.stringify(defaults.worldParameters));
  world.launchUrl = base;
  const problems = [];
  const lines = [];
  for (const pass of PASSES) {
    const result = await runPass(base, defaults, world, pass);
    problems.push(...result.problems.map((p) => `${pass.label}: ${p}`));
    lines.push(`  ${pass.label}: ${result.times.join('; ')}`);
  }
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('The settle and the timers of a page:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log(lines.join('\n'));
  console.log('The settle waits for the timers due within its budget (300 ms, 2 s), and neither a one-hour timer nor an interval holds a step, whichever time Node keeps; a timer given a string of code runs.');
});

/** One run of the feature, with Node's clock moved by the pass's offset; what went wrong, and the times of the visits. */
function runPass(base, defaults, world, pass) {
  const report = path.join(tmp, `timers-${pass.offset}.json`);
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    requireModule: defaults.requireModule,
    require: defaults.require.concat([steps]),
    paths: [feature],
    format: [`json:${report}`],
    worldParameters: world,
  }) + ' };');
  const env = Object.assign({ SLOW_MO: '0' }, process.env, {
    LAUNCH_URL: base,
    NODE_CLOCK_OFFSET: String(pass.offset),
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
  });
  delete env.WEBSHIP_AUTO_SETTLE;
  return new Promise((resolve) => {
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
      resolve(readReport(report, errors));
    });
  });
}

function readReport(report, errors) {
  const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  const problems = [];
  const times = [];
  let count = 0;
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`The run wrote no report.\n${strip(errors).slice(-1500)}`);
    return { problems, times };
  }
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
  return { problems, times };
}
