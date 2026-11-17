#!/usr/bin/env node
'use strict';

// Runs the steps that read a file by its name — the XML and YAML file steps
// and the attach step — in a project of their own, the way a project that
// installed webship-js runs them: its own tests/assets/, its own cucumber.js
// and playwright.config, the webship-js step definitions from elsewhere. A
// name is found in the project's tests/assets/, a path from the project root
// as written, and a file that is not there fails with a plain message.
//
// The pages are files of the project (file: URLs): no server is needed.
//
// Usage: node tests/check-assets.js   (npm run test:assets)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const project = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-assets-'));
const report = path.join(project, 'report.json');
const write = (file, content) => {
  fs.mkdirSync(path.dirname(path.join(project, file)), { recursive: true });
  fs.writeFileSync(path.join(project, file), content);
};

write('playwright.config.js', "module.exports = { browser: 'chromium', launchOptions: { headless: true }, contextOptions: {} };\n");
write('tests/assets/project-feed.xml', '<feed><title>Project feed</title></feed>\n');
write('tests/assets/project-config.yaml', 'name: project\nreplicas: 3\n');
write('tests/assets/project-upload.txt', 'A file of the project.\n');
write('fixtures/root-feed.xml', '<feed><title>Root feed</title></feed>\n');
write('upload.html', '<input type="file" id="file"><p id="picked">nothing</p><script>document.getElementById("file").addEventListener("change", function (e) { document.getElementById("picked").textContent = e.target.files[0].name; });</script>\n');
write('tests/features/assets.feature', [
  'Feature: Files of the project',
  '',
  '  Scenario: An XML file of the project\'s assets',
  '    Given the response content from the file "project-feed.xml"',
  '    Then the XML element "/feed/title" should be equal to "Project feed"',
  '',
  '  Scenario: A YAML file of the project\'s assets',
  '    Given the YAML response content from the file "project-config.yaml"',
  '    Then the YAML element "/name" should be equal to "project"',
  '',
  '  Scenario: An XML file named from the project root',
  '    Given the response content from the file "fixtures/root-feed.xml"',
  '    Then the XML element "/feed/title" should be equal to "Root feed"',
  '',
  '  Scenario: A file of the project\'s assets attached to a file field',
  '    Given I am on "upload.html"',
  '    When I attach the file "project-upload.txt" to "#file"',
  '    Then "#picked" should have text "project-upload.txt"',
  '',
  '  Scenario: A file that is not there',
  '    Given the response content from the file "no-such-feed.xml"',
  '',
].join('\n'));
write('cucumber.js', 'module.exports = { default: ' + JSON.stringify({
  require: [path.join(ROOT, 'tests', 'step-definitions', '**', '*.js')],
  paths: ['tests/features/assets.feature'],
  format: [`json:${report}`],
  worldParameters: { launchUrl: 'file://' + project + '/' },
}) + ' };\n');

spawnSync(process.execPath, [path.join(ROOT, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js')], {
  cwd: project,
  stdio: ['ignore', 'ignore', 'inherit'],
  env: Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off' }),
});

const problems = [];
if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
  problems.push('The run wrote no report: cucumber-js did not start.');
} else {
  const found = {};
  for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
    for (const scenario of f.elements || []) found[scenario.name] = scenario;
  }
  const failure = (scenario) => {
    const step = (scenario.steps || []).filter((s) => !s.hidden).find((s) => s.result.status !== 'passed');
    return step ? `${step.keyword}${step.name}: ${String(step.result.error_message || step.result.status).split('\n')[0]}` : '';
  };
  for (const name of ['An XML file of the project\'s assets', 'A YAML file of the project\'s assets', 'An XML file named from the project root', 'A file of the project\'s assets attached to a file field']) {
    const scenario = found[name];
    if (!scenario) { problems.push(`"${name}" did not run.`); continue; }
    const why = failure(scenario);
    if (why) problems.push(`"${name}" failed: ${why}`);
  }
  const missing = found['A file that is not there'];
  const step = missing && (missing.steps || []).filter((s) => !s.hidden)[0];
  const message = String((step && step.result.error_message) || '');
  if (!step || step.result.status !== 'failed') problems.push('A missing file did not fail its step.');
  else if (!message.includes('The file "no-such-feed.xml" was not found.')) problems.push(`A missing file failed with: ${message.split('\n')[0]}`);
  else if (!/^\s*Hint: \S/m.test(message)) problems.push('The failure of a missing file carries no hint.');
  else if (/ENOENT|^\s+at .+:\d+:\d+\)?$/m.test(message)) problems.push('The failure of a missing file shows ENOENT or a stack trace.');
}

fs.rmSync(project, { recursive: true, force: true });
if (problems.length) {
  console.error('Files of a project:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Files of a project: read from its tests/assets/ and from its root, and a missing file fails plainly.');
