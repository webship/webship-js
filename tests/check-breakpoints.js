#!/usr/bin/env node
'use strict';

// Runs scenarios with a cucumber.js that names its own breakpoints (one of
// them marked `default: true`, no `desktop`, no `mobile`) and with
// WEBSHIP_SELECTORS_BREAKPOINTS set, and checks the size each step and tag
// opens at: every one of them reads the same registry (the built-in names,
// then worldParameters.selectors.breakpoints, then the environment variable,
// then the names a scenario adds).
//
// The scenarios read the size of a blank page, so no server is needed.
//
// Usage: node tests/check-breakpoints.js   (npm run test:breakpoints)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-breakpoints-'));
const report = path.join(tmp, 'breakpoints.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'breakpoints.steps.js');
const feature = path.join(tmp, 'breakpoints.feature');

const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
fs.writeFileSync(steps, [
  `const { Then } = require(${JSON.stringify(cucumber)});`,
  "Then('the window should be {int} by {int}', async function (width, height) {",
  '  const size = await this.page.evaluate(() => `${window.innerWidth} by ${window.innerHeight}`);',
  '  if (size !== `${width} by ${height}`) throw new Error(`The window is ${size}.`);',
  '});',
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: Breakpoints from the configuration and the environment',
  '',
  '  @mobile',
  '  Scenario: The @mobile tag reads WEBSHIP_SELECTORS_BREAKPOINTS',
  '    Then the window should be 360 by 640',
  '',
  '  @desktop',
  '  Scenario: The @desktop tag opens at the breakpoint marked default',
  '    Then the window should be 992 by 768',
  '',
  '  Scenario: The set-the-viewport step reads WEBSHIP_SELECTORS_BREAKPOINTS',
  '    When I set the viewport to the "tablet" breakpoint',
  '    Then the window should be 800 by 600',
  '',
  '  Scenario: The viewing-the-site step keeps the configured names beside the environment ones',
  '    When I am viewing the site on a "wide" screen',
  '    Then the window should be 1300 by 800',
  '',
  "  Scenario: A scenario's own breakpoints keep the configured ones",
  '    Given the following responsive breakpoints:',
  '      | pocket | 320 | 480 |',
  '    When I set the viewport to the "wide" breakpoint',
  '    Then the window should be 1300 by 800',
  '    When I am viewing the site on a "pocket" device',
  '    Then the window should be 320 by 480',
  '',
].join('\n'));

const base = require(path.join(ROOT, 'cucumber.js')).default;
const world = JSON.parse(JSON.stringify(base.worldParameters));
world.selectors = Object.assign({}, world.selectors, {
  breakpoints: {
    lg: { width: 992, height: 768, default: true },
    wide: { width: 1300, height: 800 },
  },
});
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
  timeout: 180000,
  env: Object.assign({ SLOW_MO: '0' }, process.env, {
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
    WEBSHIP_SELECTORS_BREAKPOINTS: JSON.stringify({ mobile: { width: 360, height: 640 }, tablet: { width: 800, height: 600 } }),
  }),
});

const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
const problems = [];
let count = 0;
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push('The run wrote no report: cucumber-js did not start.');
} else {
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) {
      count += 1;
      const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
      if (failed) {
        problems.push(`"${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
      }
    }
  }
  if (count !== 5) problems.push(`${count} scenarios ran, not 5.`);
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('Breakpoints:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Breakpoints: the @mobile and @desktop tags, the set-the-viewport step and the viewing-the-site step read one registry.');
