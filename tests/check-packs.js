#!/usr/bin/env node
'use strict';

// Checks this webship-js beside every step pack published on npm
// (@webship-js/*-steps), without a browser:
//
//   1. each pack alone: every "Example #n:" line of its step definitions and
//      every step of the features it ships resolve to exactly one definition
//      among this webship-js and the pack (drupal-cms-steps together with the
//      drupal-core-steps it loads), so a new built-in step never takes a
//      pack's phrase;
//   2. each pack beside @webship-js/diffy-steps, which a project of any
//      platform may add: no step of the two becomes ambiguous.
//
// Packs for two different systems (a store and a CMS, a CMS and Jira) share
// phrases on purpose and are loaded in two profiles of one project, one per
// site (docs/13-faq.md, "Can I load several step packs in one project?"): the
// check prints how many steps such a pair would share, for information.
//
// The packs come from the npm registry (`npm pack`, latest); everything else
// is this checkout and its node_modules, linked, as in check-scaffold.js.
//
// Usage: node tests/check-packs.js   (npm run test:packs)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const INIT = path.join(ROOT, 'bin', 'init-webship.js');
const CUCUMBER = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const PACKS = [
  'astro', 'backdrop-cms', 'bootstrap', 'codeigniter', 'craft-cms', 'diffy', 'django', 'django-cms', 'drupal-cms', 'drupal-core', 'gatsby',
  'ghost', 'hubspot-cms', 'jira', 'joomla', 'laravel', 'magento', 'mediawiki', 'odoo', 'prestashop', 'shopify', 'squarespace', 'symfony',
  'typo3', 'webflow', 'woocommerce', 'wordpress',
];
// A pack whose glob loads another pack's steps too.
const BRINGS = { 'drupal-cms': ['drupal-core'], woocommerce: ['wordpress'] };
const COMPANION = 'diffy';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-packs-'));
const problems = [];

function run(cmd, args, options) {
  const r = spawnSync(cmd, args, Object.assign({ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, options));
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed:\n${r.stderr || r.stdout}`);
  return r;
}

// The project: the scaffold, this checkout as webship-js and its dependencies, linked.
function makeProject() {
  run(process.execPath, [INIT, '--cwd', tmp, '--skip-browsers']);
  const modules = path.join(tmp, 'node_modules');
  fs.mkdirSync(path.join(modules, '@webship-js'), { recursive: true });
  for (const entry of fs.readdirSync(path.join(ROOT, 'node_modules'))) {
    if (entry === '@webship-js' || entry === 'webship-js') continue;
    fs.symlinkSync(path.join(ROOT, 'node_modules', entry), path.join(modules, entry));
  }
  fs.symlinkSync(ROOT, path.join(modules, 'webship-js'));
}

// Every pack, as npm serves it today.
function fetchPacks() {
  const tarballs = path.join(tmp, 'tarballs');
  fs.mkdirSync(tarballs);
  const args = ['pack', '--silent', '--pack-destination', tarballs, ...PACKS.map((p) => `@webship-js/${p}-steps@latest`)];
  let out;
  try {
    out = run(NPM, args, { cwd: tmp }).stdout;
  } catch (e) {
    // One more try: a moment's error of the registry is not a finding.
    out = run(NPM, args, { cwd: tmp }).stdout;
  }
  const files = out.split('\n').map((l) => l.trim()).filter((l) => l.endsWith('.tgz'));
  const versions = {};
  for (const p of PACKS) {
    const file = files.find((f) => f.startsWith(`webship-js-${p}-steps-`));
    if (!file) throw new Error(`npm pack gave no tarball for @webship-js/${p}-steps`);
    const into = path.join(tmp, 'unpack', p);
    fs.mkdirSync(into, { recursive: true });
    run('tar', ['-xzf', path.join(tarballs, file), '-C', into]);
    fs.renameSync(path.join(into, 'package'), path.join(tmp, 'node_modules', '@webship-js', `${p}-steps`));
    versions[p] = file.slice(`webship-js-${p}-steps-`.length, -'.tgz'.length);
  }
  return versions;
}

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, ext) : (e.name.endsWith(ext) ? [p] : []);
  });
}

// One scenario per "Example #n:" line, and the features the pack ships.
function writeCorpus(pack) {
  const dir = path.join(tmp, 'node_modules', '@webship-js', `${pack}-steps`);
  const out = path.join(tmp, 'corpus', pack);
  fs.mkdirSync(out, { recursive: true });
  const lines = ['Feature: The examples of the step definitions', ''];
  let n = 0;
  for (const file of walk(path.join(dir, 'tests', 'step-definitions'), '.js')) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/Example\s*#?\s*\d*\s*:\s*(.*)$/);
      if (!m) continue;
      const text = m[1].trim().replace(/^(Given|When|Then|And|But|\*)\s+/, '');
      if (!text) continue;
      n += 1;
      lines.push(`  Scenario: ${path.relative(dir, file)} example ${n}`, `    Given ${text}`, '');
    }
  }
  fs.writeFileSync(path.join(out, 'examples.feature'), lines.join('\n'));
  let shipped = 0;
  for (const feature of walk(path.join(dir, 'tests', 'features'), '.feature')) {
    const to = path.join(out, 'features', path.relative(path.join(dir, 'tests', 'features'), feature));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(feature, to);
    shipped += 1;
  }
  return { examples: n, shipped };
}

// One dry run with every pack loaded, then each combination read from the
// definitions every step matched.
function dryRun() {
  const config = path.join(tmp, 'cucumber.packs.js');
  const requires = ['node_modules/webship-js/tests/step-definitions/**/*.js']
    .concat(PACKS.map((p) => `node_modules/@webship-js/${p}-steps/tests/step-definitions/**/*.js`));
  fs.writeFileSync(config, `module.exports = { default: ${JSON.stringify({
    requireModule: ['tsx/cjs'],
    require: requires,
    paths: ['corpus/**/*.feature'],
    worldParameters: { launchUrl: 'http://localhost:8080' },
  }, null, 2)} };\n`);
  const messages = path.join(tmp, 'dry-run.ndjson');
  run(process.execPath, [CUCUMBER, '--config', path.basename(config), '--dry-run', '--format', `message:${path.basename(messages)}`], {
    cwd: tmp,
    env: Object.assign({}, process.env, { WEBSHIP_REPORT_DISABLE: '1', FORCE_COLOR: '0' }),
  });
  return fs.readFileSync(messages, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function analyse(messages) {
  const packOf = (uri) => { const m = uri.match(/@webship-js\/([a-z0-9-]+)-steps\//); return m ? m[1] : 'webship-js'; };
  const defs = new Map(); const pickleSteps = new Map();
  for (const m of messages) {
    if (m.stepDefinition) {
      const sd = m.stepDefinition;
      const uri = sd.sourceReference.uri;
      const file = uri.includes('node_modules/') ? uri.replace(/^.*node_modules\//, '') : `webship-js/${path.relative(ROOT, path.resolve(tmp, uri))}`;
      defs.set(sd.id, { pack: packOf(uri), at: `${file}:${(sd.sourceReference.location || {}).line}` });
    }
    if (m.pickle) {
      const pack = m.pickle.uri.split(/[\\/]/)[1];
      for (const s of m.pickle.steps) pickleSteps.set(s.id, { pack, text: s.text, uri: m.pickle.uri });
    }
  }
  const steps = [];
  for (const m of messages) {
    if (!m.testCase) continue;
    for (const ts of m.testCase.testSteps) {
      if (!ts.pickleStepId) continue;
      steps.push(Object.assign({ defs: ts.stepDefinitionIds.map((id) => defs.get(id)) }, pickleSteps.get(ts.pickleStepId)));
    }
  }
  const loaded = (set) => new Set(['webship-js'].concat(...set.map((p) => [p].concat(BRINGS[p] || []))));
  const among = (step, set) => { const l = loaded(set); return step.defs.filter((d) => l.has(d.pack)); };
  return { steps, among };
}

try {
  makeProject();
  const versions = fetchPacks();
  const sizes = {};
  for (const p of PACKS) sizes[p] = writeCorpus(p);
  const { steps, among } = analyse(dryRun());

  // 1. Each pack alone.
  for (const p of PACKS) {
    for (const step of steps.filter((s) => s.pack === p)) {
      const d = among(step, [p]);
      if (d.length === 0) problems.push(`${p}-steps ${versions[p]}: undefined: "${step.text}" (${step.uri})`);
      if (d.length > 1) problems.push(`${p}-steps ${versions[p]}: ambiguous with webship-js: "${step.text}" (${d.map((x) => x.at).join(' | ')})`);
    }
  }
  // 2. Each pack beside the companion.
  for (const p of PACKS.filter((x) => x !== COMPANION)) {
    for (const step of steps.filter((s) => s.pack === p || s.pack === COMPANION)) {
      const alone = among(step, [step.pack]);
      const both = among(step, [p, COMPANION]);
      if (alone.length === 1 && both.length > 1) problems.push(`${p}-steps beside ${COMPANION}-steps: ambiguous: "${step.text}" (${both.map((x) => x.at).join(' | ')})`);
    }
  }
  // For information: the steps two packs for different systems share.
  const shared = [];
  for (let i = 0; i < PACKS.length; i += 1) {
    for (let j = i + 1; j < PACKS.length; j += 1) {
      const [a, b] = [PACKS[i], PACKS[j]];
      if (a === COMPANION || b === COMPANION || (BRINGS[a] || []).includes(b) || (BRINGS[b] || []).includes(a)) continue;
      const n = steps.filter((s) => (s.pack === a || s.pack === b) && among(s, [s.pack]).length === 1 && among(s, [a, b]).length > 1).length;
      if (n) shared.push(`${a}+${b} ${n}`);
    }
  }
  const total = PACKS.reduce((n, p) => n + sizes[p].examples, 0);
  console.log(`${PACKS.length} packs (${PACKS.map((p) => `${p} ${versions[p]}`).join(', ')}): ${total} examples and ${steps.length - total} steps of shipped features, with this webship-js.`);
  console.log(`Pairs of packs for two systems that share phrases (one profile per system): ${shared.length}${shared.length ? ` (${shared.join(', ')})` : ''}.`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems.slice(0, 200)) console.error('  ' + p);
    process.exitCode = 1;
  } else {
    console.log('Every pack resolves alone and beside the visual comparison pack: no undefined step, no ambiguous step.');
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
