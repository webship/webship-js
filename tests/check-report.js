#!/usr/bin/env node
'use strict';

// Checks the HTML report bin/generate-reports.js writes, from a small
// cucumber JSON, without a browser:
//
//   1. it links no icon of a third-party site,
//   2. "App Version" is the version of the project the report is made for,
//      and is left out when the project has no package.json,
//   3. "Executed" is "Local" on a tester's machine and "Remote" on a CI
//      runner, unless it is given.
//
// Usage: node tests/check-report.js   (npm run test:report)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const GENERATE = path.resolve(__dirname, '..', 'bin', 'generate-reports.js');
const problems = [];

const SAMPLE = [{
  keyword: 'Feature',
  name: 'A sample feature',
  line: 1,
  id: 'a-sample-feature',
  uri: 'tests/features/sample.feature',
  tags: [],
  elements: [{
    keyword: 'Scenario',
    name: 'A sample scenario',
    line: 3,
    id: 'a-sample-feature;a-sample-scenario',
    type: 'scenario',
    tags: [],
    steps: [{
      keyword: 'Given ',
      name: 'I am on the homepage',
      line: 4,
      arguments: [],
      match: { location: 'tests/step-definitions/navigation.steps.js:44' },
      result: { status: 'passed', duration: 1000000 },
    }],
  }],
}];

/**
 * Generate a report in a new project folder and return its HTML.
 *
 * @param {string} tmp          - Parent folder.
 * @param {string} name         - Name of the project folder.
 * @param {Object|null} pkg     - Its package.json, or null for none.
 * @param {Object} env          - Variables set (a null value unsets one).
 * @param {string[]} [args]     - Extra arguments of generate-reports.
 * @returns {string}
 */
function report(tmp, name, pkg, env, args) {
  const project = path.join(tmp, name);
  fs.mkdirSync(path.join(project, 'tests', 'reports'), { recursive: true });
  if (pkg) fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify(pkg));
  fs.writeFileSync(path.join(project, 'tests', 'reports', 'cucumber_report.json'), JSON.stringify(SAMPLE));
  const environment = Object.assign({}, process.env);
  for (const key of ['CI', 'WEBSHIP_REPORT_APP_VERSION', 'WEBSHIP_REPORT_EXECUTED', 'WEBSHIP_REPORT_ARGS']) delete environment[key];
  for (const [key, value] of Object.entries(env)) {
    if (value === null) delete environment[key];
    else environment[key] = value;
  }
  const run = spawnSync(process.execPath, [GENERATE].concat(args || []), { cwd: project, encoding: 'utf8', env: environment });
  const out = path.join(project, 'tests', 'reports', 'cucumber_report.html');
  if (run.status !== 0 || !fs.existsSync(out)) {
    problems.push(`${name}: generate-reports exited with ${run.status} and wrote ${fs.existsSync(out) ? 'a' : 'no'} report\n${run.stderr}`);
    return '';
  }
  return fs.readFileSync(out, 'utf8');
}

/** The value the Metadata block of a report shows for a key, or null. */
function metadata(html, key) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const match = text.match(new RegExp(key + ':\\s*(\\S+)'));
  return match ? match[1] : null;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-report-'));
try {
  const local = report(tmp, 'local', { name: 'local', version: '3.4.5' }, {});
  if (local) {
    const icons = local.match(/<link\b[^>]*\brel=["']?(?:shortcut )?icon["']?[^>]*>/gi) || [];
    for (const icon of icons) {
      if (/href=["']?(https?:)?\/\//i.test(icon)) problems.push(`the report links an icon of another site: ${icon}`);
    }
    if (/lambdatest/i.test(local)) problems.push('the report names a third-party site (lambdatest)');
    if (!/A sample scenario/.test(local)) problems.push('the report does not show the scenario of the JSON');
    if (metadata(local, 'App Version') !== '3.4.5') problems.push(`App Version is "${metadata(local, 'App Version')}", the project's package.json says 3.4.5`);
    if (metadata(local, 'Executed') !== 'Local') problems.push(`Executed is "${metadata(local, 'Executed')}" for a run without CI set; expected Local`);
  }

  const ci = report(tmp, 'ci', { name: 'ci', version: '1.0.0' }, { CI: 'true' });
  if (ci && metadata(ci, 'Executed') !== 'Remote') problems.push(`Executed is "${metadata(ci, 'Executed')}" with CI set; expected Remote`);

  const given = report(tmp, 'given', { name: 'given', version: '1.0.0' }, { WEBSHIP_REPORT_APP_VERSION: '9.9.9' }, ['--executed', 'Staging']);
  if (given) {
    if (metadata(given, 'App Version') !== '9.9.9') problems.push(`WEBSHIP_REPORT_APP_VERSION=9.9.9 gave App Version "${metadata(given, 'App Version')}"`);
    if (metadata(given, 'Executed') !== 'Staging') problems.push(`--executed Staging gave Executed "${metadata(given, 'Executed')}"`);
  }

  const bare = report(tmp, 'bare', null, {});
  if (bare && metadata(bare, 'App Version') !== null) problems.push(`a project without package.json got App Version "${metadata(bare, 'App Version')}"`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (problems.length) {
  console.error(`${problems.length} problem(s) with the HTML report:`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('The HTML report links no third-party icon; App Version and Executed say what is true for the project and the run.');
