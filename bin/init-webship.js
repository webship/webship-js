#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const packagePath = path.join(__dirname, '..');

const CUCUMBER_JS = `module.exports = {
  default: {
    timeout: 30000,
    requireModule: ['ts-node/register'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',          // Webship-js core step definitions (auto HTML report on exit; disable: WEBSHIP_REPORT_DISABLE=1).
      'tests/step-definitions/**/*.js',                                  // Your custom step definitions.
    ],
    paths: ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      colorsEnabled: true,
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
        offset: 60,
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
        dir: './screenshots',
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

const chromiumArgs: string[] = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--disable-web-security',
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
    headless: true,
    slowMo: 300,
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
  'ts-node': {
    ignore: ['node_modules/(?!webship-js/)'],
  },
};

const FEATURE_SAMPLE = `Feature: Check the home page
  As a nonymouse user
  I want to be able to visit the home page
  So that I know that the site is working

  Scenario: Check homepage
    Given I am on the homepage
    Then I should see "Love to help in speeding up the work of having Automated Functional Acceptance Testing for products to ship websites in a swift way."
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
  'generate-reports': 'generate-reports',
};

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
      '  -f, --force          Overwrite existing files',
      '      --skip-browsers  Skip `playwright install chromium`',
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
    const written = writeFileIfMissing(dest, content, opts);
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
  for (const [name, cmd] of Object.entries(TEST_SCRIPTS)) {
    if (opts.force || !pkg.scripts[name]) {
      pkg.scripts[name] = cmd;
    }
  }

  pkg.dependencies = pkg.dependencies || {};
  if (opts.force || !pkg.dependencies['webship-js']) {
    pkg.dependencies['webship-js'] = readPkgVersion();
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  return { created: !existed };
}

function installBrowsers(projectPath) {
  console.log('\n  [webship-js] Installing Playwright browsers...\n');
  const res = spawnSync(
    'npx',
    ['playwright', 'install', '--with-deps', 'chromium'],
    { cwd: projectPath, stdio: 'inherit', shell: true }
  );
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
  ensureDir(path.join(projectPath, 'screenshots'));

  const assetResults = writeTextAssets(projectPath, opts);
  const tsconfigWritten = writeTsconfig(projectPath, opts);
  const pkgResult = ensurePackageJson(projectPath, opts);

  for (const r of assetResults) {
    console.log(`  [${r.written ? 'wrote ' : 'kept  '}] ${r.file}`);
  }
  console.log(`  [${tsconfigWritten ? 'wrote ' : 'kept  '}] tsconfig.json`);
  console.log(
    `  [${pkgResult.created ? 'wrote ' : 'merged'}] package.json`
  );

  if (!opts.skipBrowsers) installBrowsers(projectPath);

  console.log('\n  [webship-js] Setup complete!\n');
}

if (require.main === module) {
  run(process.argv.slice(2));
}

module.exports = { run };
