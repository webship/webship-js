#!/usr/bin/env node
'use strict';

// Checks the scaffold a new project gets (bin/init-webship.js, the script the
// post-install runs), the way a new user meets it:
//
//   1. `npm init -y` in an empty folder, then the scaffold: the files and the
//      package.json scripts are there, and `npm test` is the suite, not npm's
//      "no test specified" placeholder,
//   2. `npm test` in that project is green against a site (the examples/
//      pages of this repository, served on a free port),
//   3. a feature named on the command line runs alone,
//   4. a second scaffold run changes nothing, a `test` script the project
//      chose itself is kept, and webship-js declared as a dev or peer
//      dependency is not listed a second time,
//   5. a `test` script that runs Nightwatch (a project from webship-js 1.x)
//      is replaced by the suite and kept as `test:nightwatch`,
//   6. `--force` rewrites the scaffold's files but keeps the project's own
//      steps in tests/step-definitions/custom.js.
//
// The browser install is skipped (--skip-browsers): Chromium must be in the
// Playwright cache already, as it is after `npx playwright install chromium`.
//
// Usage: node tests/check-scaffold.js   (npm run test:scaffold)

const crypto = require('crypto');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const INIT = path.join(ROOT, 'bin', 'init-webship.js');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const problems = [];

const EXPECTED_FILES = [
  'cucumber.js',
  'playwright.config.ts',
  'tsconfig.json',
  'package.json',
  'tests/features/check-homepage.feature',
  'tests/step-definitions/custom.js',
  'tests/reports/README.md',
];
const EXPECTED_SCRIPTS = ['test', 'test:chromium', 'test:firefox', 'test:webkit', 'test:headed', 'test:fast', 'generate-reports'];

function scaffold(dir) {
  return spawnSync(process.execPath, [INIT, '--cwd', dir, '--skip-browsers'], { encoding: 'utf8' });
}

function hashes(dir) {
  const out = {};
  for (const file of EXPECTED_FILES) {
    const full = path.join(dir, file);
    out[file] = fs.existsSync(full) ? crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex') : null;
  }
  return out;
}

// The project uses this checkout as its webship-js and shares its
// dependencies, so nothing is downloaded.
function linkDependencies(dir) {
  const target = path.join(dir, 'node_modules');
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(path.join(ROOT, 'node_modules'))) {
    fs.symlinkSync(path.join(ROOT, 'node_modules', entry), path.join(target, entry));
  }
  fs.symlinkSync(ROOT, path.join(target, 'webship-js'));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForPort(port, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve) => {
    const attempt = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.on('connect', () => { socket.destroy(); resolve(true); });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() > deadline) resolve(false);
        else setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-scaffold-'));
  let server = null;
  try {
    // 1. A new project: npm init -y, then the scaffold.
    const project = path.join(tmp, 'new-project');
    fs.mkdirSync(project);
    const init = spawnSync(NPM, ['init', '-y'], { cwd: project, encoding: 'utf8', shell: process.platform === 'win32' });
    if (init.status !== 0) throw new Error(`npm init -y failed: ${init.stderr}`);
    const placeholder = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')).scripts.test;

    const first = scaffold(project);
    if (first.status !== 0) problems.push(`the scaffold exited with ${first.status}: ${first.stderr}`);
    for (const file of EXPECTED_FILES) {
      if (!fs.existsSync(path.join(project, file))) problems.push(`the scaffold did not write ${file}`);
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
    for (const name of EXPECTED_SCRIPTS) {
      if (!pkg.scripts || !pkg.scripts[name]) problems.push(`package.json has no "${name}" script`);
    }
    if (pkg.scripts && pkg.scripts.test === placeholder) {
      problems.push(`"npm test" is still the placeholder of npm init: ${placeholder}`);
    }
    if (!pkg.dependencies || !pkg.dependencies['webship-js']) problems.push('package.json does not depend on webship-js');
    // The browser keeps the same-origin policy of a visitor's: a same-origin POST then carries its Origin
    // header, which a site's check against cross-site forms reads (tests/check-same-origin.js).
    const pwConfig = fs.existsSync(path.join(project, 'playwright.config.ts')) ? fs.readFileSync(path.join(project, 'playwright.config.ts'), 'utf8') : '';
    if (/'--disable-web-security'/.test(pwConfig)) problems.push('the scaffolded playwright.config.ts starts Chromium with --disable-web-security');

    // 2. npm test in the new project, against the examples/ pages.
    linkDependencies(project);
    const port = await freePort();
    server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'http-server', 'bin', 'http-server'), path.join(ROOT, 'examples'), '-p', String(port), '-a', '127.0.0.1', '-s'], { stdio: 'ignore' });
    if (!await waitForPort(port, 15000)) throw new Error(`the examples server did not start on port ${port}`);
    const run = spawnSync(NPM, ['test'], {
      cwd: project,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: Object.assign({}, process.env, { LAUNCH_URL: `http://127.0.0.1:${port}`, FORCE_COLOR: '0', SLOW_MO: '0', WEBSHIP_REPORT_DISABLE: '1' }),
    });
    const report = path.join(project, 'tests', 'reports', 'cucumber_report.json');
    let scenarios = 0;
    let failed = 0;
    if (fs.existsSync(report)) {
      for (const feature of JSON.parse(fs.readFileSync(report, 'utf8'))) {
        for (const scenario of feature.elements || []) {
          scenarios++;
          if ((scenario.steps || []).some((step) => step.result.status !== 'passed')) failed++;
        }
      }
    }
    if (run.status !== 0 || !scenarios || failed) {
      problems.push(`"npm test" in the new project: exit ${run.status}, ${scenarios} scenario(s), ${failed} not passed\n${(run.stdout || '').split('\n').slice(-25).join('\n')}\n${run.stderr || ''}`);
    } else {
      console.log(`  npm test in the new project: ${scenarios} scenario passed.`);
    }
    if (/colorsEnabled/.test((run.stdout || '') + (run.stderr || ''))) {
      problems.push('the scaffolded cucumber.js makes cucumber-js print a deprecation warning (colorsEnabled)');
    }

    // A feature named on the command line runs alone, beside a second one.
    const extra = path.join(project, 'tests', 'features', 'second.feature');
    fs.writeFileSync(extra, 'Feature: Second\n\n  Scenario: Second\n    Given I am on the homepage\n');
    const namedReport = path.join(tmp, 'named.json');
    const named = spawnSync(process.execPath, [path.join(ROOT, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js'), '--dry-run', 'tests/features/second.feature', '--format', `json:${namedReport}`], {
      cwd: project,
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FORCE_COLOR: '0', WEBSHIP_REPORT_DISABLE: '1' }),
    });
    const namedScenarios = fs.existsSync(namedReport)
      ? JSON.parse(fs.readFileSync(namedReport, 'utf8')).reduce((n, feature) => n + (feature.elements || []).length, 0)
      : -1;
    if (namedScenarios !== 1) {
      problems.push(`naming one feature on the command line in the new project selected ${namedScenarios} scenario(s), not 1\n${named.stderr || ''}`);
    }
    fs.rmSync(extra, { force: true });

    // 3. A second run changes nothing.
    fs.rmSync(path.join(project, 'node_modules'), { recursive: true, force: true });
    const before = hashes(project);
    const second = scaffold(project);
    if (second.status !== 0) problems.push(`the second scaffold run exited with ${second.status}`);
    const after = hashes(project);
    for (const file of EXPECTED_FILES) {
      if (before[file] !== after[file]) problems.push(`a second scaffold run changed ${file}`);
    }

    // A test script the project chose is kept.
    const own = path.join(tmp, 'own-test-script');
    fs.mkdirSync(own);
    fs.writeFileSync(path.join(own, 'package.json'), JSON.stringify({ name: 'own-test-script', version: '1.0.0', scripts: { test: 'node my-own-tests.js' } }, null, 2));
    scaffold(own);
    const ownPkg = JSON.parse(fs.readFileSync(path.join(own, 'package.json'), 'utf8'));
    if (ownPkg.scripts.test !== 'node my-own-tests.js') problems.push(`the scaffold replaced a test script of the project: ${ownPkg.scripts.test}`);
    if (!ownPkg.scripts['test:chromium']) problems.push('the scaffold did not add test:chromium beside an existing test script');

    // webship-js already declared as a dev dependency (or a peer): the scaffold leaves it there, with
    // its range, and does not list it a second time under dependencies.
    for (const field of ['devDependencies', 'peerDependencies']) {
      const declared = path.join(tmp, `declared-in-${field}`);
      fs.mkdirSync(declared);
      fs.writeFileSync(path.join(declared, 'package.json'), JSON.stringify({ name: `declared-in-${field.toLowerCase()}`, version: '1.0.0', [field]: { 'webship-js': '^2.0.12' } }, null, 2));
      scaffold(declared);
      const declaredPkg = JSON.parse(fs.readFileSync(path.join(declared, 'package.json'), 'utf8'));
      if (declaredPkg.dependencies && declaredPkg.dependencies['webship-js']) {
        problems.push(`with webship-js in ${field}, the scaffold listed it again under dependencies (${declaredPkg.dependencies['webship-js']})`);
      }
      if ((declaredPkg[field] || {})['webship-js'] !== '^2.0.12') {
        problems.push(`the scaffold changed the range of webship-js in ${field}: ${(declaredPkg[field] || {})['webship-js']}`);
      }
    }

    // A project from webship-js 1.x: its test script runs Nightwatch.
    const legacy = path.join(tmp, 'from-1x');
    fs.mkdirSync(legacy);
    const nightwatch = 'nightwatch --format @cucumber/pretty-formatter --format json:./tests/reports/cucumber-report.json';
    fs.writeFileSync(path.join(legacy, 'package.json'), JSON.stringify({ name: 'from-1x', version: '1.0.0', scripts: { test: nightwatch } }, null, 2));
    const legacyRun = scaffold(legacy);
    const legacyPkg = JSON.parse(fs.readFileSync(path.join(legacy, 'package.json'), 'utf8'));
    if (legacyPkg.scripts.test !== 'cucumber-js --config cucumber.js') {
      problems.push(`the scaffold kept a Nightwatch test script from 1.x: "npm test" is still ${legacyPkg.scripts.test}`);
    }
    if (legacyPkg.scripts['test:nightwatch'] !== nightwatch) {
      problems.push(`the scaffold did not keep the old Nightwatch command as test:nightwatch: ${legacyPkg.scripts['test:nightwatch']}`);
    }
    if (legacyPkg.scripts.test !== nightwatch && !/nightwatch/i.test(legacyRun.stdout || '')) {
      problems.push('the scaffold replaced the Nightwatch test script without saying so');
    }

    // --force keeps the project's own steps.
    const customFile = path.join(project, 'tests', 'step-definitions', 'custom.js');
    const ownSteps = fs.readFileSync(customFile, 'utf8') + "\nGiven('a step of the project', function () {});\n";
    fs.writeFileSync(customFile, ownSteps);
    fs.writeFileSync(path.join(project, 'playwright.config.ts'), '// changed by the project\n');
    const forced = spawnSync(process.execPath, [INIT, '--cwd', project, '--skip-browsers', '--force'], { encoding: 'utf8' });
    if (forced.status !== 0) problems.push(`the scaffold with --force exited with ${forced.status}`);
    if (fs.readFileSync(customFile, 'utf8') !== ownSteps) {
      problems.push('the scaffold with --force overwrote tests/step-definitions/custom.js, the steps of the project');
    }
    if (fs.readFileSync(path.join(project, 'playwright.config.ts'), 'utf8') === '// changed by the project\n') {
      problems.push('the scaffold with --force did not rewrite playwright.config.ts');
    }

    // No package.json at all: the scaffold writes one.
    const bare = path.join(tmp, 'no-package-json');
    fs.mkdirSync(bare);
    scaffold(bare);
    const barePkgPath = path.join(bare, 'package.json');
    if (!fs.existsSync(barePkgPath) || !JSON.parse(fs.readFileSync(barePkgPath, 'utf8')).scripts.test) {
      problems.push('without a package.json the scaffold did not write one with a test script');
    }
  } finally {
    if (server) server.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (problems.length) {
    console.error(`\n${problems.length} problem(s) with the scaffold:`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
  }
  console.log('The scaffold gives a new project its files and scripts, and its first "npm test" is green.');
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
