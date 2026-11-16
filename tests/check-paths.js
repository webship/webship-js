#!/usr/bin/env node
'use strict';

// Checks that a feature, a scenario (file:line) or several features named on
// the command line of cucumber-js run alone, and that a run that names none
// runs the whole of tests/features/ (cucumber.js, commandLinePaths). Dry runs
// only: no browser, no server.
//
// Usage: node tests/check-paths.js   (npm run test:paths)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-paths-'));
const problems = [];

// The scenarios a dry run selects, from a JSON report written to the temporary
// folder; the report and the formats of cucumber.js are left alone.
function scenarios(args) {
  const report = path.join(tmp, `run-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const run = spawnSync(process.execPath, [BIN, '--config', 'cucumber.js', '--dry-run', ...args, '--format', `json:${report}`], {
    cwd: ROOT,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { WEBSHIP_REPORT_DISABLE: '1', FORCE_COLOR: '0' }),
  });
  if (!fs.existsSync(report)) throw new Error(`cucumber-js ${args.join(' ')} wrote no report:\n${run.stderr}`);
  const found = [];
  for (const feature of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of feature.elements || []) found.push(`${feature.uri}:${scenario.line}`);
  }
  return { found, warned: /specified paths in both/.test(run.stderr || '') };
}

function featureFiles() {
  return fs.readdirSync(path.join(ROOT, 'tests', 'features')).filter((f) => f.endsWith('.feature')).sort();
}

try {
  const all = scenarios([]);
  const files = featureFiles();
  if (!all.found.length) problems.push('a run that names no feature selected no scenario');
  const inAll = new Set(all.found.map((s) => s.split(':')[0]));
  for (const f of files) {
    if (!inAll.has(`tests/features/${f}`)) problems.push(`a run that names no feature left out tests/features/${f}`);
  }

  const [first, second] = files;
  const one = scenarios([`tests/features/${first}`]);
  const own = all.found.filter((s) => s.startsWith(`tests/features/${first}:`));
  if (one.found.length !== own.length || one.found.some((s) => !s.startsWith(`tests/features/${first}:`))) {
    problems.push(`naming tests/features/${first} selected ${one.found.length} scenario(s), not its own ${own.length}`);
  }
  if (one.warned) problems.push('naming a feature makes cucumber-js warn that the paths of the configuration and of the command line are merged');

  const line = own[0].split(':')[1];
  const byLine = scenarios([`tests/features/${first}:${line}`]);
  if (byLine.found.length !== 1 || byLine.found[0] !== own[0]) {
    problems.push(`naming the scenario tests/features/${first}:${line} selected ${byLine.found.length} scenario(s), not 1`);
  }

  const two = scenarios([`tests/features/${first}`, '--tags', 'not @no-such-tag', `tests/features/${second}`]);
  const ownTwo = all.found.filter((s) => s.startsWith(`tests/features/${first}:`) || s.startsWith(`tests/features/${second}:`));
  if (two.found.length !== ownTwo.length) {
    problems.push(`naming two features around an option selected ${two.found.length} scenario(s), not their ${ownTwo.length}`);
  }
  if (!problems.length) {
    console.log(`  no feature named: ${all.found.length} scenarios; ${first}: ${one.found.length}; ${first}:${line}: 1; ${first} and ${second}: ${two.found.length}.`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s) with the paths of the command line:`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('A feature or a scenario named on the command line runs alone; naming none runs the whole suite.');
