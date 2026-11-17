#!/usr/bin/env node
'use strict';

// Checks the step documentation and the features against the step
// definitions, without a browser:
//
//   1. every step definition in tests/step-definitions carries a JSDoc block
//      with a description and at least five "Example #n:" blocks that use
//      the step itself (CLAUDE.md §4.2),
//   2. every step line of every example resolves to exactly one definition
//      (none undefined, none ambiguous),
//   3. at least one example of a definition resolves to that definition,
//   4. every step in tests/features resolves to exactly one definition.
//
// The matching is done by cucumber-js itself (`--dry-run`), so regular
// expressions and Cucumber expressions are read the way a real run reads
// them. An example may span several lines: the steps that set the scene, a
// data table or a doc string count as part of it.
//
// Usage: node tests/check-examples.js   (npm run test:examples)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STEPS_DIR = path.join(ROOT, 'tests', 'step-definitions');
const KEYWORD = /^(Given|When|Then|And|But|\*)\s/;

/**
 * Read every step definition of a step file with the JSDoc block above it.
 *
 * @param {string} file - File name inside tests/step-definitions.
 * @returns {Array<Object>} One entry per definition.
 */
function readDefinitions(file) {
  const source = fs.readFileSync(path.join(STEPS_DIR, file), 'utf8');
  const definitions = [];
  // Some steps are registered through an alias (ThenF, WhenF): they count.
  const re = /(?:^|\n)[ \t]*(Given|When|Then|defineStep)F?\(\s*(\/(?:\\\/|[^/\n])+\/[a-z]*|'(?:\\'|[^'\n])*'|"(?:\\"|[^"\n])*"|`[^`\n]*`)/g;
  let m;
  while ((m = re.exec(source))) {
    const index = m.index + (m[0].startsWith('\n') ? 1 : 0);
    const before = source.slice(0, index);
    const line = before.split('\n').length;
    let doc = null;
    const docEnd = before.lastIndexOf('*/');
    if (docEnd !== -1 && /^\s*$/.test(before.slice(docEnd + 2))) {
      // The block opens on a line of its own; "/**" may also be part of a
      // URL pattern inside an example.
      let docStart = -1;
      const open = /(^|\n)[ \t]*\/\*\*/g;
      let o;
      while ((o = open.exec(before.slice(0, docEnd)))) docStart = o.index + o[0].indexOf('/**');
      if (docStart !== -1) doc = before.slice(docStart + 3, docEnd);
    }
    const examples = [];
    const description = [];
    if (doc !== null) {
      let current = null;
      for (const raw of doc.split('\n').map((l) => l.replace(/^\s*\*\s?/, ''))) {
        const example = raw.match(/^\s*Example\s*#?\d*[^:]*:\s*(.*)$/);
        if (example) {
          current = [];
          examples.push(current);
          // Text after the colon is the first step, or a caption of the block.
          if (KEYWORD.test(example[1].trim())) current.push(example[1].trim());
          continue;
        }
        if (/^\s*@\w+/.test(raw)) { current = null; continue; }
        if (current) { if (raw.trim()) current.push(raw.trim()); continue; }
        if (!examples.length && raw.trim()) description.push(raw.trim());
      }
    }
    definitions.push({ file, line, pattern: m[2], hasDoc: doc !== null, description: description.join(' '), examples, own: 0, ownExamples: new Set() });
  }
  return definitions;
}

/**
 * Turn the examples of the definitions of one file into a feature: one
 * scenario per example. Returns the feature text and, per feature line, the
 * definition the step line belongs to.
 */
function buildFeature(file, definitions) {
  const lines = [`Feature: examples of ${file}`, ''];
  const owners = {};
  for (const definition of definitions) {
    definition.examples.forEach((example, n) => {
      const body = [];
      let inDocString = false;
      let steps = 0;
      for (const raw of example) {
        if (/^("""|```)/.test(raw)) { inDocString = !inDocString; if (steps) body.push({ text: '      ' + raw }); continue; }
        if (inDocString) { if (steps) body.push({ text: '      ' + raw }); continue; }
        if (/^\|.*\|\s*(#.*)?$/.test(raw)) { if (steps) body.push({ text: '      ' + raw.replace(/\|\s+#[^|]*$/, '|') }); continue; }
        if (!KEYWORD.test(raw)) continue; // a caption or a comment
        let step = raw.replace(/\s{2,}#\s.*$/, '').replace(/^(\S+)\s+/, '$1 ');
        if (!steps) step = step.replace(/^(And|But|\*) /, 'Given ');
        steps++;
        body.push({ text: '    ' + step, step: raw });
      }
      if (!steps) return;
      lines.push(`  Scenario: ${file} line ${definition.line} example ${n + 1}`);
      for (const item of body) {
        lines.push(item.text);
        if (item.step) owners[lines.length] = { definition, step: item.step, example: n };
      }
      lines.push('');
    });
  }
  return { text: lines.join('\n'), owners };
}

/**
 * Dry-run cucumber-js over some feature paths and return its JSON report and
 * its usage report.
 */
function dryRun(tmp, name, featurePaths) {
  const usage = path.join(tmp, `${name}-usage.json`);
  const report = path.join(tmp, `${name}-report.json`);
  const config = path.join(tmp, `${name}-cucumber.js`);
  const base = require(path.join(ROOT, 'cucumber.js')).default;
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    requireModule: base.requireModule,
    require: base.require,
    paths: featurePaths,
    format: [`usage-json:${usage}`, `json:${report}`],
    worldParameters: base.worldParameters,
  }) + ' };');
  const bin = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
  const run = spawnSync(process.execPath, [bin, '--config', path.relative(ROOT, config), '--dry-run'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { WEBSHIP_REPORT_DISABLE: '1' }),
    maxBuffer: 1 << 28,
  });
  if (!fs.existsSync(report) || !fs.existsSync(usage) || !fs.readFileSync(report, 'utf8').trim()) {
    console.error((run.stdout || '') + (run.stderr || ''));
    console.error(`cucumber-js --dry-run did not produce a report for the ${name}.`);
    process.exit(2);
  }
  return {
    report: JSON.parse(fs.readFileSync(report, 'utf8')),
    usage: JSON.parse(fs.readFileSync(usage, 'utf8')),
  };
}

const problems = [];
const files = fs.readdirSync(STEPS_DIR).filter((f) => f.endsWith('.steps.js')).sort();
const all = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-examples-'));
const featureOwners = {};
const featurePaths = [];

for (const file of files) {
  const definitions = readDefinitions(file);
  all.push(...definitions);
  for (const d of definitions) {
    const where = `${d.file}:${d.line}`;
    if (!d.hasDoc) problems.push(`${where}  no JSDoc block above the definition ${d.pattern}`);
    else if (!d.description) problems.push(`${where}  the JSDoc block has no description`);
    if (d.hasDoc && !d.examples.length) problems.push(`${where}  no "Example #n:" line`);
  }
  const feature = buildFeature(file, definitions);
  const featurePath = path.join(tmp, `${file}.feature`);
  fs.writeFileSync(featurePath, feature.text);
  featurePaths.push(path.relative(ROOT, featurePath));
  featureOwners[`${file}.feature`] = feature.owners;
}

const byPlace = {};
for (const d of all) byPlace[`${d.file}:${d.line}`] = d;

// 1. The examples.
const examples = dryRun(tmp, 'examples', featurePaths);
const matched = {};
for (const entry of examples.usage) {
  for (const match of entry.matches || []) {
    matched[`${path.basename(match.uri)}:${match.line}`] = `${path.basename(entry.uri)}:${entry.line}`;
  }
}
let exampleSteps = 0;
for (const feature of examples.report) {
  const owners = featureOwners[path.basename(feature.uri)] || {};
  for (const scenario of feature.elements || []) {
    for (const step of scenario.steps || []) {
      const owner = owners[step.line];
      if (!owner) continue;
      exampleSteps++;
      const where = `${owner.definition.file}:${owner.definition.line}`;
      const status = step.result && step.result.status;
      if (status === 'undefined') problems.push(`${where}  example step matches no definition: ${owner.step}`);
      else if (status === 'ambiguous') problems.push(`${where}  example step matches more than one definition: ${owner.step}`);
      else if (matched[`${path.basename(feature.uri)}:${step.line}`] === where) {
        owner.definition.own++;
        owner.definition.ownExamples.add(owner.example);
      }
    }
  }
}
const MIN_EXAMPLES = 5;
for (const d of all) {
  if (d.examples.length && !d.own) problems.push(`${d.file}:${d.line}  none of its examples uses the step itself: ${d.pattern}`);
  else if (d.hasDoc && d.ownExamples.size < MIN_EXAMPLES) problems.push(`${d.file}:${d.line}  ${d.ownExamples.size} of its examples use the step itself, fewer than ${MIN_EXAMPLES}: ${d.pattern}`);
}

// 2. The features of the suite.
const base = require(path.join(ROOT, 'cucumber.js')).default;
const suite = dryRun(tmp, 'features', base.paths);
let featureSteps = 0;
for (const feature of suite.report) {
  for (const scenario of feature.elements || []) {
    for (const step of scenario.steps || []) {
      if (step.hidden) continue;
      featureSteps++;
      const status = step.result && step.result.status;
      if (status === 'undefined') problems.push(`${feature.uri}:${step.line}  undefined step: ${step.keyword}${step.name}`);
      if (status === 'ambiguous') problems.push(`${feature.uri}:${step.line}  ambiguous step: ${step.keyword}${step.name}`);
    }
  }
}
// A definition cucumber-js loaded that the reader above did not see would
// escape every check: say so instead of passing.
for (const entry of suite.usage) {
  if (!byPlace[`${path.basename(entry.uri)}:${entry.line}`]) {
    problems.push(`${entry.uri}:${entry.line}  definition not read by this check: ${entry.pattern}`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

const exampleCount = all.reduce((n, d) => n + d.examples.length, 0);
console.log(`${all.length} step definitions in ${files.length} files, ${exampleCount} examples (${exampleSteps} step lines), ${featureSteps} feature steps.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('Every definition is documented, every example step and every feature step resolves to exactly one definition.');
