#!/usr/bin/env node
'use strict';

// Checks the HTML report that tests/step-definitions/webship.js builds when
// a run of cucumber-js ends, in three runs of a small project:
//
//   1. `--parallel 2`: the report is built once, by the process that runs
//      cucumber-js, from the whole JSON report; no worker tries to read a
//      JSON report that is still being written.
//   2. A JSON report written somewhere else than tests/reports/ (the `json:`
//      formatter of the config file): the report is built from that file.
//   3. No JSON formatter at all: one line says that there is no report and
//      why, with no stack trace.
//
// The scenarios never navigate, so no server is needed; each one opens a
// browser, as every scenario does.
//
// Usage: node tests/check-exit-report.js   (npm run test:exit-report)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CUCUMBER = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-exit-report-'));
const problems = [];

// A project of its own, so that no tests/reports/ of this repository is read.
const project = path.join(tmp, 'project');
fs.mkdirSync(project, { recursive: true });
fs.writeFileSync(path.join(project, 'playwright.config.js'), 'module.exports = ' + JSON.stringify({
  browser: 'chromium',
  launchOptions: { headless: true },
  contextOptions: { viewport: null },
}) + ';\n');
const steps = path.join(project, 'plain.steps.js');
fs.writeFileSync(steps, [
  `const { Given } = require(${JSON.stringify(CUCUMBER)});`,
  "Given('this step passes', function () {});",
  '',
].join('\n'));
const features = [];
for (const name of ['first', 'second']) {
  const file = path.join(project, `${name}.feature`);
  fs.writeFileSync(file, [
    `Feature: The ${name} feature`,
    '',
    `  Scenario: The ${name} scenario`,
    '    Given this step passes',
    '',
  ].join('\n'));
  features.push(file);
}
const base = require(path.join(ROOT, 'cucumber.js')).default;
const world = JSON.parse(JSON.stringify(base.worldParameters));

/**
 * Run cucumber-js in the project with a config of its own and return what it
 * printed.
 *
 * @param {string} name       - Name of the run (and of its config file).
 * @param {string[]} format   - Formatters of the config file.
 * @param {string[]} [args]   - Extra arguments of cucumber-js.
 * @param {Object} [vars]      - Extra environment variables.
 * @returns {{output: string, html: string, status: number}}
 */
function run(name, format, args, vars) {
  const html = path.join(tmp, `${name}.html`);
  const config = path.join(project, `${name}.cucumber.js`);
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    require: [path.join(ROOT, 'tests', 'step-definitions', '**', '*.js'), steps],
    paths: features,
    format,
    worldParameters: world,
  }) + ' };');
  const env = Object.assign({ SLOW_MO: '0' }, process.env, {
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_REPORT_OUT: html,
    FORCE_COLOR: '0',
  });
  delete env.WEBSHIP_REPORT_DISABLE;
  delete env.WEBSHIP_REPORT_JSON;
  delete env.WEBSHIP_REPORT_ARGS;
  Object.assign(env, vars || {});
  const result = spawnSync(process.execPath, [path.join(CUCUMBER, 'bin', 'cucumber.js'), '--config', path.basename(config)].concat(args || []), {
    cwd: project,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    encoding: 'utf8',
  });
  return { output: `${result.stdout}\n${result.stderr}`, html, status: result.status };
}

const count = (text, re) => (text.match(re) || []).length;
const shown = (text) => text.trim().split('\n').slice(0, 12).map((line) => `      ${line}`).join('\n');
const STACK = /^\s+at .+:\d+:\d+\)?$/m;

// 1. Two workers, the JSON report named by WEBSHIP_REPORT_JSON.
{
  const json = path.join(tmp, 'parallel.json');
  const { output, html, status } = run('parallel', ['progress', `json:${json}`], ['--parallel', '2'], { WEBSHIP_REPORT_JSON: json });
  if (status !== 0) problems.push(`The --parallel run failed (exit ${status}):\n${shown(output)}`);
  if (/Unable to parse|Unexpected end of JSON input/.test(output)) {
    problems.push(`With --parallel 2, a process read the JSON report before it was complete:\n${shown(output)}`);
  }
  const built = count(output, /\[webship-js\] HTML report/g);
  if (built !== 1) problems.push(`With --parallel 2, the HTML report was built ${built} times, not once.`);
  if (!fs.existsSync(html)) problems.push('With --parallel 2, no HTML report was written.');
}

// 2. The JSON report written somewhere else, by the config file.
{
  const json = path.join(tmp, 'elsewhere', 'run.json');
  const { output, html } = run('elsewhere', ['progress', `json:${json}`]);
  if (/ENOENT/.test(output) || STACK.test(output)) {
    problems.push(`With the JSON report written elsewhere, the end of the run printed an error:\n${shown(output)}`);
  }
  if (!fs.existsSync(html)) problems.push(`With the JSON report written to ${path.relative(tmp, json)}, no HTML report was built from it.`);
}

// 3. No JSON formatter.
{
  const { output, html } = run('none', ['progress']);
  if (/ENOENT/.test(output) || STACK.test(output)) {
    problems.push(`With no JSON report, the end of the run printed an error:\n${shown(output)}`);
  }
  if (count(output, /\[webship-js\] No HTML report/g) !== 1) {
    problems.push(`With no JSON report, the end of the run did not say once that there is no HTML report:\n${shown(output)}`);
  }
  if (fs.existsSync(html)) problems.push('With no JSON report, an HTML report was written anyway.');
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('HTML report at the end of a run:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('HTML report at the end of a run: built once with --parallel, built from a JSON report written elsewhere, and one plain line when there is none.');
