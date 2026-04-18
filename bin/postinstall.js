#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { run } = require('./init-webship');

const packagePath = path.join(__dirname, '..');
const projectPath = process.env.INIT_CWD || process.cwd();

// Skip when invoked from webship-js itself (development / CI).
if (
  projectPath === packagePath ||
  projectPath.startsWith(path.join(packagePath, 'node_modules'))
) {
  process.exit(0);
}

// Only run on a fresh project — cucumber.js absence marks an uninitialized project.
// Re-installs (npm install, npm ci) will not overwrite user customizations.
if (fs.existsSync(path.join(projectPath, 'cucumber.js'))) {
  process.exit(0);
}

run(['--cwd', projectPath]);
