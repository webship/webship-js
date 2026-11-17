#!/usr/bin/env node
'use strict';

// Runs the scenarios of tests/must-fail/ and checks that every one of them
// FAILS, at its last step, with the message its description announces
// ("Fails with: ..."), and that the message names the page (for an API step,
// the request the response answers) and carries a hint, with no Playwright
// call log and no stack trace.
//
// A step that cannot fail proves nothing, and a failure nobody can read
// costs a tester an hour. Each scenario here asserts something that is not
// true on the example pages; the steps before the last one must pass.
//
// Usage: node tests/check-must-fail.js   (npm run test:must-fail)
// The examples/ pages must be served on the launch URL of cucumber.js
// (npm start; LAUNCH_URL to point elsewhere).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'tests', 'must-fail');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-must-fail-'));
const report = path.join(tmp, 'must-fail.json');
const config = path.join(tmp, 'cucumber.js');

const base = require(path.join(ROOT, 'cucumber.js')).default;
const features = fs.readdirSync(DIR).filter((file) => file.endsWith('.feature')).sort().map((file) => `tests/must-fail/${file}`);
// The same step definitions and world as the suite; the screenshots of these
// deliberate failures go to the temporary folder, not to screenshots/.
const world = JSON.parse(JSON.stringify(base.worldParameters));
world.screenshot = Object.assign({}, world.screenshot, { dir: path.join(tmp, 'screenshots') });
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require,
  paths: features,
  format: [`json:${report}`],
  worldParameters: world,
}) + ' };');

spawnSync(process.execPath, [path.join(ROOT, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
  cwd: ROOT,
  stdio: ['ignore', 'ignore', 'inherit'],
  env: Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off' }),
});

const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
const problems = [];
let count = 0;

if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push('The must-fail run wrote no report: cucumber-js did not start.');
} else {
  for (const feature of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of feature.elements || []) {
      count += 1;
      const where = `${feature.uri}:${scenario.line} "${scenario.name}"`;
      const wanted = ((strip(scenario.description).match(/Fails with:\s*(.+)/) || [])[1] || '').trim();
      const steps = (scenario.steps || []).filter((step) => !step.hidden);
      const last = steps[steps.length - 1];
      const earlier = steps.slice(0, -1).filter((step) => step.result.status !== 'passed');
      if (!wanted) { problems.push(`${where}: no "Fails with:" line in its description.`); continue; }
      if (earlier.length) { problems.push(`${where}: an earlier step did not pass (${earlier[0].keyword}${earlier[0].name}: ${earlier[0].result.status}) ${strip(earlier[0].result.error_message).split('\n')[0]}`); continue; }
      if (!last || last.result.status !== 'failed') { problems.push(`${where}: its last step ${last ? last.result.status : 'is missing'}; it must fail.`); continue; }
      const message = strip(last.result.error_message);
      const shown = message.split('\n').slice(0, 4).join('\n      ');
      if (!message.includes(wanted)) { problems.push(`${where}: failed, but not with "${wanted}":\n      ${shown}`); continue; }
      if (!/^\s*Hint: \S/m.test(message)) { problems.push(`${where}: the failure carries no hint:\n      ${shown}`); continue; }
      if (!/^\s*(?:Page|Request): \S/m.test(message)) { problems.push(`${where}: the failure names neither the page nor the request:\n      ${shown}`); continue; }
      if (/Call log:|Timeout \d+ms exceeded|^\s+at .+:\d+:\d+\)?$/m.test(message)) { problems.push(`${where}: the failure shows a Playwright call log, a raw timeout or a stack trace:\n      ${shown}`); continue; }
      console.log(`  fails as it must: ${scenario.name}\n      ${message.split('\n')[0].trim()}`);
    }
  }
  if (!count) problems.push('No must-fail scenario ran.');
}

fs.rmSync(tmp, { recursive: true, force: true });

if (problems.length) {
  console.error(`\n${problems.length} problem(s) in ${count} must-fail scenario(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n${count} must-fail scenarios: each failed at its last step with the announced message, the page (or the request) and a hint.`);
