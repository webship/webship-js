#!/usr/bin/env node
'use strict';

// Runs the steps that print what they found and checks that the text reaches
// the cucumber JSON report as well as the console: a step's attachment is
// what the HTML report and a CI artifact show under it.
//
//   - `I print accessibility violations`
//   - `I print the full accessibility check`
//
// The page is written by the check itself (an image without an alt
// attribute), so no server is needed.
//
// Usage: node tests/check-attachments.js   (npm run test:attachments)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CUCUMBER = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-attachments-'));
const report = path.join(tmp, 'attachments.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'page.steps.js');
const feature = path.join(tmp, 'attachments.feature');

fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(CUCUMBER)});`,
  "Given('a page with an image without an alt attribute', async function () {",
  "  await this.page.setContent('<!doctype html><html lang=\"en\"><head><title>Attachments</title></head>' +",
  "    '<body><main><h1>Attachments</h1><img src=\"data:image/gif;base64,R0lGODlhAQABAAAAACw=\" width=\"10\" height=\"10\"></main></body></html>');",
  '});',
  '',
].join('\n'));
fs.writeFileSync(feature, [
  'Feature: Printed findings reach the report',
  '',
  '  Scenario: The accessibility print steps',
  '    Given a page with an image without an alt attribute',
  '    Then I print accessibility violations',
  '     And I print the full accessibility check',
  '',
].join('\n'));
const lines = { 'print accessibility violations': 5, 'print the full accessibility check': 6 };

const base = require(path.join(ROOT, 'cucumber.js')).default;
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require.concat([steps]),
  paths: [feature],
  format: [`json:${report}`],
  worldParameters: base.worldParameters,
}) + ' };');

const run = spawnSync(process.execPath, [path.join(CUCUMBER, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off', FORCE_COLOR: '0' }),
});

/**
 * The text of an embedding of the JSON report: cucumber-js writes the data
 * of every attachment in base64.
 */
function embeddedText(embedding) {
  const data = String(embedding.data || '');
  const decoded = Buffer.from(data, 'base64').toString('utf8');
  return /image-alt|accessibility/i.test(decoded) ? decoded : data;
}

const problems = [];
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push(`The run wrote no report: cucumber-js did not start.\n${run.stdout}\n${run.stderr}`);
} else {
  const byLine = {};
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) {
      for (const step of (scenario.steps || []).filter((s) => !s.hidden)) byLine[step.line] = step;
    }
  }
  for (const [name, line] of Object.entries(lines)) {
    const step = byLine[line];
    if (!step || !step.result || step.result.status !== 'passed') {
      problems.push(`"${name}" (line ${line}) did not pass: ${step && step.result ? step.result.status : 'missing'} ${(step && step.result && step.result.error_message) || ''}`);
      continue;
    }
    const texts = (step.embeddings || []).filter((e) => /^text\//.test(e.mime_type)).map(embeddedText);
    if (!texts.some((text) => /image-alt|image\(s\) without an alt attribute/i.test(text))) {
      problems.push(`"${name}" (line ${line}) attached nothing about the image without alt to the JSON report (${texts.length} text attachment(s)).`);
    }
  }
  if (!/image-alt|without an alt attribute/i.test(run.stdout)) {
    problems.push('The print steps no longer print their findings to the console.');
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('Printed findings in the report:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Printed findings in the report: both accessibility print steps attach what they print to their step, and still print it.');
