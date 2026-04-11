#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// The directory where `npm install` was invoked (the user's project root)
const projectPath = process.env.INIT_CWD || process.cwd();

// The webship-js package directory
const packagePath = path.join(__dirname, '..');

// Skip if running inside webship-js itself (e.g. during development or CI of webship-js)
if (
  projectPath === packagePath ||
  projectPath.startsWith(path.join(packagePath, 'node_modules'))
) {
  process.exit(0);
}

// Path to required template files bundled with webship-js
const requiredDir = path.join(packagePath, 'required');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Only copy template files on a fresh install (tests/ not yet present)
const testsTarget = path.join(projectPath, 'tests');
if (!fs.existsSync(testsTarget)) {
  console.log('\n  [webship-js] Installing required files...\n');

  copyDirSync(path.join(requiredDir, 'tests'), testsTarget);

  fs.copyFileSync(
    path.join(requiredDir, 'generate-reports.js'),
    path.join(projectPath, 'generate-reports.js')
  );

  fs.copyFileSync(
    path.join(requiredDir, 'cucumber.js'),
    path.join(projectPath, 'cucumber.js')
  );

  fs.copyFileSync(
    path.join(requiredDir, 'tsconfig.json'),
    path.join(projectPath, 'tsconfig.json')
  );

  fs.copyFileSync(
    path.join(requiredDir, 'playwright.config.ts'),
    path.join(projectPath, 'playwright.config.ts')
  );

  // Only copy package.json if the project does not have one yet
  const targetPkgJson = path.join(projectPath, 'package.json');
  if (!fs.existsSync(targetPkgJson)) {
    fs.copyFileSync(path.join(requiredDir, 'package.json'), targetPkgJson);
  }
}

// Always ensure the test scripts are present in package.json
const targetPkgJson = path.join(projectPath, 'package.json');
if (fs.existsSync(targetPkgJson)) {
  const pkgJson = JSON.parse(fs.readFileSync(targetPkgJson, 'utf8'));
  pkgJson.scripts = pkgJson.scripts || {};
  pkgJson.scripts.test = 'cucumber-js --config cucumber.js; node generate-reports.js;';
  pkgJson.scripts['test:firefox'] = 'BROWSER=firefox cucumber-js --config cucumber.js; node generate-reports.js;';
  pkgJson.scripts['test:webkit'] = 'BROWSER=webkit cucumber-js --config cucumber.js; node generate-reports.js;';
  fs.writeFileSync(targetPkgJson, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
}

// Install Playwright browsers
console.log('\n  [webship-js] Installing Playwright browsers...\n');
spawnSync('npx', ['playwright', 'install', '--with-deps', 'chromium'], {
  cwd: projectPath,
  stdio: 'inherit',
  shell: true,
});

console.log('\n  [webship-js] Setup complete!\n');
