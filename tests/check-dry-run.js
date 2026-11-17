#!/usr/bin/env node
'use strict';

// Runs a dry run with the pretty formatter, as the scaffold's cucumber.js
// does, and checks what it prints: the steps, the "? undefined" line of a
// step no definition matches and the summary, and no "- skipped" line — in a
// dry run every hook and every step is skipped, and a line for each of them
// buries the ones the dry run is for. Then a real run, whose step after a
// failing one must still be shown as skipped.
//
// No page is opened by the dry run; the real run never navigates. No server
// is needed.
//
// Usage: node tests/check-dry-run.js   (npm run test:dry-run)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-dry-run-'));
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'dry-run.steps.js');
const dryFeature = path.join(tmp, 'dry-run.feature');
const realFeature = path.join(tmp, 'real-run.feature');

const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
fs.writeFileSync(steps, [
  `const { Then } = require(${JSON.stringify(cucumber)});`,
  "Then('this step fails on purpose', function () { throw new Error('Failing on purpose.'); });",
  "Then('this step comes after the failure', function () {});",
  '',
].join('\n'));
fs.writeFileSync(dryFeature, [
  'Feature: A dry run',
  '',
  '  Scenario: Steps that are defined',
  '    Given I am on "/about-us.html"',
  '    When I press "Submit"',
  '    Then I should see "About Us"',
  '',
  '  Scenario: A step that no definition matches',
  '    Given I am on "/about-us.html"',
  '    Then this step is not defined anywhere',
  '',
].join('\n'));
fs.writeFileSync(realFeature, [
  'Feature: A real run',
  '',
  '  Scenario: A step after a failing step is skipped',
  '    Then this step fails on purpose',
  '    And this step comes after the failure',
  '',
].join('\n'));

const base = require(path.join(ROOT, 'cucumber.js')).default;
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require.concat([steps]),
  format: ['@cucumber/pretty-formatter'],
  worldParameters: base.worldParameters,
}) + ' };');

const env = Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off', FORCE_COLOR: '0' });
const plain = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
const run = (args) => {
  const r = spawnSync(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)].concat(args), {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env,
  });
  return plain(`${r.stdout || ''}${r.stderr || ''}`);
};

const problems = [];
const skipped = /^\s*-\s+skipped\s*$/;

const dry = run(['--dry-run', path.relative(ROOT, dryFeature)]).split('\n');
const dryText = dry.join('\n');
const skippedLines = dry.filter((line) => skipped.test(line)).length;
if (skippedLines) problems.push(`The dry run printed ${skippedLines} "- skipped" line(s).`);
for (const step of ['Given I am on "/about-us.html"', 'When I press "Submit"', 'Then I should see "About Us"', 'Then this step is not defined anywhere']) {
  if (!dry.some((line) => line.trim() === step)) problems.push(`The dry run did not print the step: ${step}`);
}
if (!dry.some((line) => /^\s*\?\s+undefined\s*$/.test(line))) problems.push('The dry run did not print the "? undefined" line of the undefined step.');
if (!/2 scenarios \(1 undefined, 1 skipped\)/.test(dryText)) problems.push('The dry run did not print its summary "2 scenarios (1 undefined, 1 skipped)".');
// The steps of a scenario follow one another: no empty line left where a
// "- skipped" line was taken out.
const first = dry.findIndex((line) => line.trim() === 'Given I am on "/about-us.html"');
if (first >= 0 && (dry[first + 1] || '').trim() !== 'When I press "Submit"') {
  problems.push(`The dry run left a line between two steps: "${dry[first + 1]}".`);
}

const real = run([path.relative(ROOT, realFeature)]).split('\n');
const after = real.findIndex((line) => line.trim() === 'And this step comes after the failure');
if (after < 0 || !skipped.test(real[after + 1] || '')) {
  problems.push('A real run no longer shows the step after a failing step as "- skipped".');
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('Dry run output:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Dry run output: the steps, the undefined step and the summary, with no "- skipped" line; a real run still shows its skipped steps.');
