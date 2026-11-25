#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const packagePath = path.join(__dirname, '..');

const CUCUMBER_JS = `// A feature file, a scenario (file:line), a folder or a rerun file named on
// the command line of cucumber-js runs alone (cucumber-js 12 would add it to
// the paths below): \`npx cucumber-js tests/features/login.feature\`.
const OPTIONS_WITH_A_VALUE = new Set([
  '-c', '--config', '-f', '--format', '--format-options', '--i18n-keywords',
  '-i', '--import', '-l', '--loader', '--language', '--name', '--order',
  '-p', '--profile', '--parallel', '--plugin', '--plugin-options',
  '-r', '--require', '--require-module', '--retry', '--retry-tag-filter',
  '--shard', '-t', '--tags', '--world-parameters',
]);

function commandLinePaths() {
  if (!/cucumber(-js|\\.js)?$/.test(String(process.argv[1] || ''))) return [];
  const args = process.argv.slice(2);
  const paths = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('-')) {
      if (OPTIONS_WITH_A_VALUE.has(args[i])) i += 1;
    } else {
      paths.push(args[i]);
    }
  }
  return paths;
}

module.exports = {
  default: {
    timeout: 30000,                                                     // Overridden by webship-js's setDefaultTimeout (45s); raise it with WEBSHIP_STEP_TIMEOUT.
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',          // Webship-js core step definitions (auto HTML report on exit; disable: WEBSHIP_REPORT_DISABLE=1).
      'tests/step-definitions/**/*.js',                                  // Your custom step definitions.
    ],
    // FEATURES=tests/features/a.feature,tests/features/b.feature runs a subset too.
    paths: process.env.FEATURES ? process.env.FEATURES.split(',') : (commandLinePaths().length ? [] : ['tests/features/**/*.feature']),
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      theme: {
        'feature keyword': ['bold', 'blue'],
        'feature name': ['blue', 'underline'],
        'feature description': ['blueBright'],
        'scenario keyword': ['bold', 'magenta'],
        'scenario name': ['magenta', 'underline'],
        'step keyword': ['bold', 'green'],
        'step text': ['greenBright', 'italic'],
      },
    },
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost:8080',
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        css: {},
        xpath: {},
        filesPath: './tests/selectors/',
        files: [],
        // Named viewport sizes for the viewing-the-site and set-the-viewport
        // steps and the @mobile / @desktop tags (built in: xs..xxxl, mobile,
        // tablet, desktop). Without a desktop here, @desktop opens at the
        // breakpoint marked default: true.
        breakpoints: {
          xs:   { width: 375,  height: 667  },
          sm:   { width: 576,  height: 800  },
          md:   { width: 768,  height: 1024 },
          lg:   { width: 992,  height: 768  },
          xl:   { width: 1200, height: 900, default: true },
          xxl:  { width: 1400, height: 900  },
          xxxl: { width: 1920, height: 1080 },
        },
      },
      screenshot: {
        dir: './tests/screenshots',
        purge: false,
        onFailed: true,
        onEveryStep: false,
        alwaysFullscreen: false,
        failedPrefix: 'failed_',
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
        filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
        infoTypes: '',
      },
    },
  },
};
`;

const PLAYWRIGHT_CONFIG_TS = `import type { LaunchOptions, BrowserContextOptions } from 'playwright';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const browser = (process.env.BROWSER || 'chromium') as BrowserName;

// No --disable-web-security: it turns off the same-origin policy a visitor's
// browser has, and Chromium then sends a same-origin POST without its Origin
// header, so a site that checks the origin of a form refuses it. Playwright
// reaches the elements of a cross-origin frame without it.
const chromiumArgs: string[] = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--ignore-certificate-errors',
  '--disable-extensions',
  '--incognito',
  '--disable-infobars',
];

interface PlaywrightConfig {
  browser: BrowserName;
  launchOptions: LaunchOptions;
  contextOptions: BrowserContextOptions;
}

const config: PlaywrightConfig = {
  browser,
  launchOptions: {
    headless: process.env.HEADLESS !== 'false',
    // Pause before every browser action, in ms: 300 by default, 800 with
    // HEADLESS=false so a headed run can be watched. SLOW_MO wins over both:
    // SLOW_MO=0 for full speed (npm run test:fast), in CI too.
    slowMo: parseInt(process.env.SLOW_MO || (process.env.HEADLESS === 'false' ? '800' : '300'), 10),
    args: browser === 'chromium' ? chromiumArgs : [],
  },
  contextOptions: {
    viewport: { width: 1600, height: 1200 },
    ignoreHTTPSErrors: true,
  },
};

export = config;
`;

const TSCONFIG_JSON = {
  compilerOptions: {
    target: 'ES2020',
    module: 'CommonJS',
    strict: true,
    esModuleInterop: true,
    types: ['node'],
  },
};

// The starter feature passes on any site that answers on the launch URL
// (LAUNCH_URL, default http://localhost:8080): it asserts nothing about the
// content of a site the scaffold cannot know.
const FEATURE_SAMPLE = `Feature: Check the home page
  As an anonymous user
  I want to be able to visit the home page
  So that I know that the site is working

  Scenario: Check homepage
    Given I am on the homepage
    Then I should be on the homepage
`;

const CUSTOM_STEP_JS = `const { Given, When, Then } = require('@cucumber/cucumber');
const playwrightConfig = require(require('path').join(process.cwd(), 'playwright.config'));

// Add your custom step definitions here.
`;

const TEXT_ASSETS = {
  'cucumber.js': CUCUMBER_JS,
  'playwright.config.ts': PLAYWRIGHT_CONFIG_TS,
  'tests/features/README.md': '# Features\n',
  'tests/features/check-homepage.feature': FEATURE_SAMPLE,
  'tests/reports/README.md': '# Reports\n',
  'tests/step-definitions/README.md': '# Step Definitions\n',
  'tests/step-definitions/custom.js': CUSTOM_STEP_JS,
};

const TEST_SCRIPTS = {
  test: 'cucumber-js --config cucumber.js',
  'test:chromium': 'BROWSER=chromium cucumber-js --config cucumber.js',
  'test:firefox': 'BROWSER=firefox cucumber-js --config cucumber.js',
  'test:webkit': 'BROWSER=webkit cucumber-js --config cucumber.js',
  'test:headed': 'HEADLESS=false cucumber-js --config cucumber.js',
  'test:fast': 'SLOW_MO=0 cucumber-js --config cucumber.js',
  'generate-reports': 'generate-reports',
};

// The `test` script `npm init` writes. It is a placeholder, not a choice of
// the project, so the scaffold replaces it.
const NPM_PLACEHOLDER_TEST = /^echo "Error: no test specified" && exit 1$/;

// A `test` script that runs Nightwatch is the one webship-js 1.x gave a
// project. webship-js 2.x runs on cucumber-js and Playwright and brings no
// Nightwatch, so the scaffold replaces it and keeps it as `test:nightwatch`.
const NIGHTWATCH_TEST = /(^|[\s;&|/])nightwatch(\s|$)/i;

// Files of the scaffold that hold the project's own code once written: never
// overwritten, not even with --force.
const PROJECT_FILES = new Set(['tests/step-definitions/custom.js']);

const DEFAULT_PKG = {
  name: 'project-name',
  version: '2.0.0',
  description: '',
  main: 'index.js',
  author: '',
  license: 'MIT',
  private: false,
  scripts: {},
  homepage: 'https://github.com/webship/webship-js',
  dependencies: {},
};

function parseArgs(argv) {
  const opts = { force: false, skipBrowsers: false, help: false, cwd: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force' || a === '-f') opts.force = true;
    else if (a === '--skip-browsers') opts.skipBrowsers = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--cwd') opts.cwd = argv[++i];
  }
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: init-webship-js [options]',
      '',
      'Scaffold a webship-js project: cucumber.js, playwright.config.ts,',
      'tsconfig.json, tests/ tree, and package.json scripts.',
      'Idempotent — safe to run multiple times.',
      '',
      'Options:',
      '  -f, --force          Overwrite the files and scripts of the scaffold',
      '                       (never tests/step-definitions/custom.js)',
      '      --skip-browsers  Skip `npx playwright install chromium`',
      '      --cwd <dir>      Target directory (default: $INIT_CWD or cwd)',
      '  -h, --help           Show this help',
      '',
    ].join('\n')
  );
}

function writeFileIfMissing(destPath, content, { force }) {
  if (!force && fs.existsSync(destPath)) return false;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  return true;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readPkgVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8')
    );
    const major = String(pkg.version).split('.')[0] || '2';
    return `~${major}.0.0`;
  } catch {
    return '~2.0.0';
  }
}

function writeTextAssets(projectPath, opts) {
  const results = [];
  for (const [rel, content] of Object.entries(TEXT_ASSETS)) {
    const dest = path.join(projectPath, rel);
    const force = opts.force && !PROJECT_FILES.has(rel);
    const written = writeFileIfMissing(dest, content, { force });
    results.push({ file: rel, written });
  }
  return results;
}

function writeTsconfig(projectPath, opts) {
  const dest = path.join(projectPath, 'tsconfig.json');
  if (!opts.force && fs.existsSync(dest)) return false;
  fs.writeFileSync(dest, JSON.stringify(TSCONFIG_JSON, null, 2) + '\n', 'utf8');
  return true;
}

function ensurePackageJson(projectPath, opts) {
  const pkgPath = path.join(projectPath, 'package.json');
  const existed = fs.existsSync(pkgPath);

  let pkg;
  if (existed) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } else {
    pkg = { ...DEFAULT_PKG };
  }

  pkg.scripts = pkg.scripts || {};
  let replacedNightwatch = null;
  for (const [name, cmd] of Object.entries(TEST_SCRIPTS)) {
    const current = String(pkg.scripts[name] || '').trim();
    const placeholder = name === 'test' && NPM_PLACEHOLDER_TEST.test(current);
    const nightwatch = name === 'test' && NIGHTWATCH_TEST.test(current);
    if (nightwatch && current !== cmd) {
      if (!pkg.scripts['test:nightwatch']) pkg.scripts['test:nightwatch'] = pkg.scripts.test;
      replacedNightwatch = pkg.scripts.test;
    }
    if (opts.force || !pkg.scripts[name] || placeholder || nightwatch) {
      pkg.scripts[name] = cmd;
    }
  }

  // webship-js is listed once: where the project already declares it (a dev or peer dependency
  // included), with its range; --force only refreshes that range. Otherwise it goes under
  // dependencies.
  const declaredIn = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
    .find((field) => pkg[field] && pkg[field]['webship-js']);
  if (!declaredIn) {
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['webship-js'] = readPkgVersion();
  } else if (opts.force) {
    pkg[declaredIn]['webship-js'] = readPkgVersion();
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  return { created: !existed, replacedNightwatch };
}

// The browser itself goes into the Playwright cache of the user: no special
// rights are needed. The system libraries it runs on need root, so they are
// installed with it only when the scaffold already runs as root (a container,
// a CI job); otherwise the user is told how to add them.
function isRoot() {
  return typeof process.getuid === 'function' && process.getuid() === 0;
}

function installBrowsers(projectPath) {
  console.log('\n  [webship-js] Installing the Playwright browser (Chromium)...\n');
  const win = process.platform === 'win32';
  const args = ['playwright', 'install'].concat(isRoot() ? ['--with-deps'] : [], ['chromium']);
  const res = win
    ? spawnSync(`npx ${args.join(' ')}`, { cwd: projectPath, stdio: 'inherit', shell: true })
    : spawnSync('npx', args, { cwd: projectPath, stdio: 'inherit' });
  return res.status === 0;
}

function run(argv) {
  const opts = parseArgs(argv);
  if (opts.help) return printHelp();

  const projectPath = path.resolve(
    opts.cwd || process.env.INIT_CWD || process.cwd()
  );

  if (
    projectPath === packagePath ||
    projectPath.startsWith(path.join(packagePath, 'node_modules'))
  ) {
    console.log('  [webship-js] Skipping init inside webship-js itself.');
    return;
  }

  console.log(`\n  [webship-js] Initializing project at ${projectPath}\n`);

  ensureDir(projectPath);
  ensureDir(path.join(projectPath, 'tests', 'features'));
  ensureDir(path.join(projectPath, 'tests', 'reports'));
  ensureDir(path.join(projectPath, 'tests', 'step-definitions'));
  ensureDir(path.join(projectPath, 'tests', 'selectors'));
  ensureDir(path.join(projectPath, 'tests', 'screenshots'));

  const assetResults = writeTextAssets(projectPath, opts);
  const tsconfigWritten = writeTsconfig(projectPath, opts);
  const pkgResult = ensurePackageJson(projectPath, opts);

  for (const r of assetResults) {
    const note = !r.written && opts.force && PROJECT_FILES.has(r.file)
      ? ' (the steps of the project: --force never overwrites it)'
      : '';
    console.log(`  [${r.written ? 'wrote ' : 'kept  '}] ${r.file}${note}`);
  }
  console.log(`  [${tsconfigWritten ? 'wrote ' : 'kept  '}] tsconfig.json`);
  console.log(
    `  [${pkgResult.created ? 'wrote ' : 'merged'}] package.json`
  );
  if (pkgResult.replacedNightwatch) {
    console.log(
      [
        '',
        '  [webship-js] "npm test" ran Nightwatch (a webship-js 1.x project). It now runs',
        '  cucumber-js: cucumber-js --config cucumber.js',
        '  The old command is kept as "npm run test:nightwatch".',
      ].join('\n')
    );
  }

  const browsersInstalled = opts.skipBrowsers || installBrowsers(projectPath);

  if (!browsersInstalled) {
    console.log(
      [
        '',
        '  [webship-js] The project files are in place, but the browser was NOT installed.',
        '  Install it before the first run:',
        '',
        '    npx playwright install chromium',
        '',
      ].join('\n')
    );
  } else {
    console.log('\n  [webship-js] Setup complete!');
  }
  console.log(
    [
      '',
      '  Run the starter feature against your site:',
      '',
      '    LAUNCH_URL=https://your-site.example npm test',
      '',
      '  If the browser does not start for a missing system library (Linux):',
      '',
      '    sudo npx playwright install-deps chromium',
      '',
    ].join('\n')
  );
}

if (require.main === module) {
  run(process.argv.slice(2));
}

module.exports = { run };
