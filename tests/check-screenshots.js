#!/usr/bin/env node
'use strict';

// Runs three scenarios with the failure screenshots on and checks which of
// them leave a "failed_" screenshot: the one whose step fails does; the one
// that a step skips on purpose (the step returns 'skipped', the way a suite
// leaves out a scenario that does not apply to the site) and the one that
// stops at a pending step do not. The failure screenshot is also attached to
// the failed step in the JSON report (an image/png embedding), so the HTML
// report shows it; the other two steps carry none.
//
// The scenarios never navigate, so no server is needed.
//
// Usage: node tests/check-screenshots.js   (npm run test:screenshots)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-screenshots-'));
const shots = path.join(tmp, 'screenshots');
const report = path.join(tmp, 'outcomes.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'outcomes.steps.js');
const feature = path.join(tmp, 'outcomes.feature');

const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
fs.writeFileSync(steps, [
  `const { Given, Then } = require(${JSON.stringify(cucumber)});`,
  "Given('this scenario does not apply here', function () { return 'skipped'; });",
  "Given('this step is not written yet', function () { return 'pending'; });",
  "Then('this step fails on purpose', function () { throw new Error('Failing on purpose.'); });",
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: Outcomes and failure screenshots',
  '',
  '  Scenario: A step skips the scenario on purpose',
  '    Given this scenario does not apply here',
  '',
  '  Scenario: A step is pending',
  '    Given this step is not written yet',
  '',
  '  Scenario: A step fails',
  '    Then this step fails on purpose',
  '',
  '  Scenario: Named screenshots',
  '    Then I save screenshot with name "homepage.png"',
  '     And I save fullscreen screenshot with name "full-page.JPG"',
  '     And I save screenshot with name "plain-name"',
  '',
].join('\n'));
const lines = { skipped: 4, pending: 7, failed: 10 };

const base = require(path.join(ROOT, 'cucumber.js')).default;
const world = JSON.parse(JSON.stringify(base.worldParameters));
world.screenshot = Object.assign({}, world.screenshot, { dir: shots, onFailed: true, onEveryStep: false, purge: false });
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require.concat([steps]),
  paths: [feature],
  format: [`json:${report}`],
  worldParameters: world,
}) + ' };');

spawnSync(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
  cwd: ROOT,
  stdio: ['ignore', 'ignore', 'inherit'],
  env: Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off' }),
});

const problems = [];
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push('The run wrote no report: cucumber-js did not start.');
} else {
  const statuses = {};
  const images = {};
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) {
      for (const step of (scenario.steps || []).filter((s) => !s.hidden)) {
        statuses[step.line] = step.result && step.result.status;
        images[step.line] = (step.embeddings || []).filter((e) => e.mime_type === 'image/png' && e.data).length;
      }
    }
  }
  for (const [outcome, line] of Object.entries(lines)) {
    if (statuses[line] !== outcome) problems.push(`The step on line ${line} ended "${statuses[line]}", not "${outcome}": the check itself is broken.`);
  }
  const files = fs.existsSync(shots) ? fs.readdirSync(shots).filter((name) => name.startsWith('failed_')) : [];
  const forLine = (line) => files.filter((name) => new RegExp(`\\.feature_${line}\\.(png|html)$`).test(name));
  if (!forLine(lines.failed).some((name) => name.endsWith('.png'))) {
    problems.push(`The failed step (line ${lines.failed}) left no failure screenshot; files: ${files.join(', ') || 'none'}.`);
  }
  for (const outcome of ['skipped', 'pending']) {
    const found = forLine(lines[outcome]);
    if (found.length) problems.push(`The ${outcome} step (line ${lines[outcome]}) left failure screenshots: ${found.join(', ')}.`);
    if (images[lines[outcome]]) problems.push(`The ${outcome} step (line ${lines[outcome]}) carries ${images[lines[outcome]]} screenshot(s) in the JSON report.`);
  }
  // A name that ends with the extension of a file the step writes keeps
  // that one extension: "homepage.png" is homepage.png, not homepage.png.png.
  const saved = fs.existsSync(shots) ? fs.readdirSync(shots) : [];
  for (const name of ['homepage.png', 'homepage.html', 'full-page.png', 'full-page.html', 'plain-name.png', 'plain-name.html']) {
    if (!saved.includes(name)) problems.push(`The named screenshot ${name} was not written; files: ${saved.filter((f) => !f.startsWith('failed_')).join(', ') || 'none'}.`);
  }
  if (images[lines.failed] !== 1) {
    problems.push(`The failed step (line ${lines.failed}) carries ${images[lines.failed] || 0} screenshot(s) in the JSON report, not 1: no report can show it.`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('Failure screenshots:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Failure screenshots: the failed step left one, attached to it in the JSON report; the skipped and the pending step left none. Named screenshots keep the one extension their name gives.');
