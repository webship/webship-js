#!/usr/bin/env node
'use strict';

// Runs a scenario with a cucumber.js whose worldParameters carry nothing but
// the launch URL, and checks that it passes and that the run ends by itself.
// Every other block of worldParameters (minWaitTime, selectors, screenshot,
// video, javascript) is optional: a project may leave any of them out.
//
// The scenario writes its own page, so no server is needed.
//
// Usage: node tests/check-config.js   (npm run test:config)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-config-'));
const report = path.join(tmp, 'minimal.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'minimal.steps.js');
const feature = path.join(tmp, 'minimal.feature');
const LIMIT = 120000;

const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(cucumber)});`,
  "Given('a page that reads {string}', async function (text) {",
  "  await this.page.setContent(`<main><h1>${text}</h1><button>Go</button></main>`);",
  '});',
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: A configuration with only the launch URL',
  '',
  '  Scenario: The built-in steps and hooks run without the optional settings',
  '    Given a page that reads "Hello"',
  '    When I press "Go"',
  '    Then I should see "Hello"',
  '',
].join('\n'));

const base = require(path.join(ROOT, 'cucumber.js')).default;
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require.concat([steps]),
  paths: [feature],
  format: [`json:${report}`],
  worldParameters: { launchUrl: 'http://localhost:8080' },
}) + ' };');

const started = Date.now();
const run = spawnSync(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8',
  timeout: LIMIT,
  killSignal: 'SIGKILL',
  env: Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off' }),
});

const problems = [];
const output = `${run.stdout || ''}${run.stderr || ''}`.replace(/\u001b\[[0-9;]*m/g, '');
if (run.error && run.error.code === 'ETIMEDOUT') {
  problems.push(`The run did not end by itself within ${LIMIT / 1000} seconds: it was stopped.`);
}
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push('The run wrote no report.');
} else {
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) {
      for (const step of scenario.steps || []) {
        const status = step.result && step.result.status;
        if (status !== 'passed' && !(step.hidden && status === 'skipped')) {
          const what = step.hidden ? `the ${step.keyword.trim()} hook` : `"${step.keyword}${step.name}"`;
          problems.push(`${what} ended "${status}": ${String((step.result && step.result.error_message) || '').split('\n')[0]}`);
        }
      }
    }
  }
}
if (run.status !== 0 && !problems.length) problems.push(`cucumber-js exited with ${run.status}:\n${output.slice(-1500)}`);

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('A configuration with only the launch URL:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log(`A configuration with only the launch URL: the scenario passed and the run ended in ${Math.round((Date.now() - started) / 1000)} s.`);
