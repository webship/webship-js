#!/usr/bin/env node
'use strict';

// Runs the steps whose length the scenario gives under a step timeout
// shorter than that length (WEBSHIP_STEP_TIMEOUT=4000) and checks that each
// one runs past it: "I wait 10 seconds" on a page that never settles waits
// longer than 4 seconds and passes, a web-first assertion "within 9 seconds"
// waits for an element that shows after 7 seconds, and one that never holds
// fails with its own message after its 6 seconds — none of them ends with
// cucumber's "function timed out".
//
// The pages are data: URLs: no server is needed.
//
// Usage: node tests/check-time-limit.js   (npm run test:time-limit)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-time-limit-'));
const report = path.join(tmp, 'time-limit.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'time-limit.steps.js');
const feature = path.join(tmp, 'time-limit.feature');

// A page that never settles: a timer that reschedules itself and changes the
// page every 100 ms. And one whose "#late" element shows after 7 seconds.
const NEVER_SETTLES = '<p id="beat">0</p><script>var n = 0; (function tick() { document.getElementById("beat").textContent = String(++n); setTimeout(tick, 100); })();</script>';
const SHOWS_LATE = '<p id="late" hidden>Late</p><script>setTimeout(function () { document.getElementById("late").hidden = false; }, 7000);</script>';

const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(cucumber)});`,
  `Given('a page that never settles', async function () { await this.page.goto('data:text/html,' + encodeURIComponent(${JSON.stringify(NEVER_SETTLES)})); });`,
  `Given('a page whose element shows late', async function () { await this.page.goto('data:text/html,' + encodeURIComponent(${JSON.stringify(SHOWS_LATE)})); });`,
  '',
].join('\n'));

// name, steps, the status of the last step, its shortest duration in seconds, a text of its failure
const scenarios = [
  ['A wait in seconds runs past the step timeout', 'Given a page that never settles\n    When I wait 10 seconds', 'passed', 4.5, null],
  ['A wait with a maximum runs past the step timeout', 'Given a page that never settles\n    When I wait max of 10 seconds', 'passed', 4.5, null],
  ['A wait for a number of seconds runs past the step timeout', 'Given a page that never settles\n    When I wait for 10 seconds', 'passed', 4.5, null],
  ['A web-first assertion waits as long as it is told', 'Given a page whose element shows late\n    Then "#late" should be visible within 9 seconds', 'passed', 6.5, null],
  ['A web-first assertion that never holds fails with its own message', 'Given a page that never settles\n    Then "#never" should be visible within 6 seconds', 'failed', 5.5, 'Expected "#never" to be visible'],
];
fs.writeFileSync(feature, ['Feature: Steps that run for the time the scenario gives', ''].concat(
  scenarios.map(([name, body]) => `  Scenario: ${name}\n    ${body}\n`)
).join('\n'));

const base = require(path.join(ROOT, 'cucumber.js')).default;
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require.concat([steps]),
  paths: [feature],
  format: [`json:${report}`],
  worldParameters: base.worldParameters,
}) + ' };');

spawnSync(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
  cwd: ROOT,
  stdio: ['ignore', 'ignore', 'inherit'],
  env: Object.assign({ SLOW_MO: '0' }, process.env, {
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_STEP_TIMEOUT: '4000',
  }),
});

const problems = [];
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push('The run wrote no report: cucumber-js did not start.');
} else {
  const found = {};
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) found[scenario.name] = scenario;
  }
  for (const [name, , status, seconds, text] of scenarios) {
    const scenario = found[name];
    if (!scenario) { problems.push(`"${name}" did not run.`); continue; }
    const visible = (scenario.steps || []).filter((s) => !s.hidden);
    const last = visible[visible.length - 1];
    const result = (last && last.result) || {};
    const message = String(result.error_message || '');
    const took = (result.duration || 0) / 1e9;
    if (result.status !== status) {
      problems.push(`"${name}": the step ${result.status}, it must have ${status}${message ? `: ${message.split('\n')[0]}` : ''}.`);
      continue;
    }
    if (took < seconds) problems.push(`"${name}": the step ended after ${took.toFixed(1)} s; it must run past the 4-second step timeout (${seconds} s or more).`);
    if (/function timed out/.test(message)) problems.push(`"${name}": the step was cut by the step timeout: ${message.split('\n')[0]}`);
    if (text && !message.includes(text)) problems.push(`"${name}": the failure does not say "${text}": ${message.split('\n')[0]}`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('Steps with a length of their own:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Steps with a length of their own: each ran for the time the scenario gave it, past the step timeout.');
