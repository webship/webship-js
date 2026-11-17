#!/usr/bin/env node
'use strict';

// Runs the JavaScript-error checks with console warnings captured
// (WEBSHIP_JS_ERROR_LEVELS=error,warning) and checks what each one does:
// "there should be no JavaScript errors" counts errors only (an uncaught
// error or console.error), "there should be no JavaScript warnings" counts
// warnings only, and what a check did not read is still reported at the end
// of the scenario: a warning after the errors check, an error after the
// warnings check.
//
// The page is the blank page of the browser: no server is needed.
//
// Usage: node tests/check-javascript-errors.js   (npm run test:js-errors)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-js-errors-'));
const report = path.join(tmp, 'js-errors.json');
const config = path.join(tmp, 'cucumber.js');
const steps = path.join(tmp, 'js-errors.steps.js');
const feature = path.join(tmp, 'js-errors.feature');

const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(cucumber)});`,
  "Given('the page logs a warning', async function () { await this.page.evaluate(() => console.warn('Check warning: this option is deprecated')); await this.page.waitForTimeout(100); });",
  "Given('the page logs an error', async function () { await this.page.evaluate(() => console.error('Check error: the request was refused')); await this.page.waitForTimeout(100); });",
  '',
].join('\n'));

// name → [the status of its last step, the status of the scenario's After hooks, a text the run must print for it]
const scenarios = [
  ['A warning is not an error', 'Given the page logs a warning\n    Then there should be no JavaScript errors', 'passed', 'passed', 'Check warning'],
  ['An error is an error', 'Given the page logs an error\n    Then there should be no JavaScript errors', 'failed', 'passed', null],
  ['A warning is a warning', 'Given the page logs a warning\n    Then there should be no JavaScript warnings', 'failed', 'passed', null],
  ['An error is not a warning', 'Given the page logs an error\n    Then there should be no JavaScript warnings', 'passed', 'passed', 'Check error'],
  ['@js-fail A warning still fails a scenario in fail mode', 'Given the page logs a warning\n    Then there should be no JavaScript errors', 'passed', 'failed', null],
  ['@js-fail An error still fails a scenario in fail mode', 'Given the page logs an error\n    Then there should be no JavaScript warnings', 'passed', 'failed', null],
];
fs.writeFileSync(feature, ['Feature: JavaScript errors and warnings', ''].concat(scenarios.map(([name, body]) => {
  const tag = name.startsWith('@') ? name.split(' ')[0] : '';
  const title = tag ? name.slice(tag.length + 1) : name;
  return (tag ? `  ${tag}\n` : '') + `  Scenario: ${title}\n    ${body}\n`;
})).join('\n'));

const base = require(path.join(ROOT, 'cucumber.js')).default;
fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
  requireModule: base.requireModule,
  require: base.require.concat([steps]),
  paths: [feature],
  format: [`json:${report}`],
  worldParameters: base.worldParameters,
}) + ' };');

const run = spawnSync(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: Object.assign({ SLOW_MO: '0' }, process.env, {
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'warn',
    WEBSHIP_JS_ERROR_LEVELS: 'error,warning',
  }),
});
const printed = `${run.stdout || ''}\n${run.stderr || ''}`;

const problems = [];
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push(`The run wrote no report: cucumber-js did not start.\n${printed}`);
} else {
  const found = {};
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) found[scenario.name] = scenario;
  }
  for (const [name, , lastStatus, afterStatus, text] of scenarios) {
    const title = name.startsWith('@') ? name.slice(name.indexOf(' ') + 1) : name;
    const scenario = found[title];
    if (!scenario) { problems.push(`"${title}" did not run.`); continue; }
    const visible = (scenario.steps || []).filter((s) => !s.hidden);
    const last = visible[visible.length - 1];
    // cucumber-js writes the hooks into the steps of the JSON report, hidden.
    const after = (scenario.steps || []).filter((s) => s.hidden && s.keyword === 'After').map((h) => h.result && h.result.status);
    const afterOutcome = after.includes('failed') ? 'failed' : 'passed';
    if (!last || last.result.status !== lastStatus) {
      problems.push(`"${title}": its check ${last ? last.result.status : 'is missing'}, it must have ${lastStatus}${last && last.result.error_message ? `: ${last.result.error_message.split('\n')[0]}` : ''}.`);
    }
    if (afterOutcome !== afterStatus) problems.push(`"${title}": the end-of-scenario report ${afterOutcome}, it must have ${afterStatus}.`);
    if (text && !new RegExp(`JavaScript errors during "${title}"[\\s\\S]*${text}`).test(printed)) {
      problems.push(`"${title}": the end-of-scenario report did not print "${text}".`);
    }
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('JavaScript errors and warnings:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('JavaScript errors and warnings: each check counts its own kind, and what it did not read is reported at the end of the scenario.');
