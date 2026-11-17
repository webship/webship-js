#!/usr/bin/env node
'use strict';

// Runs a project World that extends the PlaywrightWorld webship-js exports,
// with a project step that calls this.smartSettle(), and checks that the
// extended World keeps what webship-js puts on a page (the @mobile viewport,
// the settle of the smart waits); then runs a World that replaces it
// without extending it and checks that the run says so.
//
// The check serves its own page on a free local port, so no other server is
// needed.
//
// Usage: node tests/check-world.js   (npm run test:world)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-world-'));
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
const webship = path.join(ROOT, 'tests', 'step-definitions', 'webship.js');
const defaults = require(path.join(ROOT, 'cucumber.js')).default;

const PAGE = `<!doctype html><html><head><title>World</title></head><body>
<h1>World</h1>
<button id="add" type="button">Add</button>
<p id="cart">Empty</p>
<script>
document.getElementById('add').addEventListener('click', function () {
  setTimeout(function () { document.getElementById('cart').textContent = '1 item'; }, 600);
});
</script></body></html>`;

const extending = [
  `const { setWorldConstructor, When, Then } = require(${JSON.stringify(cucumber)});`,
  `const { PlaywrightWorld } = require(${JSON.stringify(webship)});`,
  'class ProjectWorld extends PlaywrightWorld {',
  "  greeting() { return 'hello from the project World'; }",
  '}',
  'setWorldConstructor(ProjectWorld);',
  "When('I put one item in the cart', async function () {",
  "  await this.page.click('#add');",
  '  await this.smartSettle();',
  '});',
  "Then('the World should be the project one', function () {",
  "  if (this.greeting() !== 'hello from the project World') throw new Error('Not the project World.');",
  '});',
  "Then('the window should be {int} by {int}', async function (width, height) {",
  '  const size = await this.page.evaluate(() => `${window.innerWidth} by ${window.innerHeight}`);',
  '  if (size !== `${width} by ${height}`) throw new Error(`The window is ${size}.`);',
  '});',
  '',
].join('\n');

const replacing = [
  `const { setWorldConstructor, World, Then } = require(${JSON.stringify(cucumber)});`,
  `const playwright = require(${JSON.stringify(path.join(ROOT, 'node_modules', 'playwright'))});`,
  'class OwnWorld extends World {',
  '  async openBrowser() {',
  '    this.playwrightBrowser = await playwright.chromium.launch();',
  '    this.context = await this.playwrightBrowser.newContext();',
  '    this.page = await this.context.newPage();',
  '  }',
  '}',
  'setWorldConstructor(OwnWorld);',
  '',
].join('\n');

function run(name, support, lines, base) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir, { recursive: true });
  const steps = path.join(dir, 'world.steps.js');
  const feature = path.join(dir, `${name}.feature`);
  const report = path.join(dir, 'report.json');
  const config = path.join(dir, 'cucumber.js');
  fs.writeFileSync(steps, support);
  fs.writeFileSync(feature, lines.join('\n') + '\n');
  const world = JSON.parse(JSON.stringify(defaults.worldParameters));
  world.launchUrl = base;
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    requireModule: defaults.requireModule,
    require: defaults.require.concat([steps]),
    paths: [feature],
    format: [`json:${report}`],
    worldParameters: world,
  }) + ' };');
  const env = Object.assign({ SLOW_MO: '0' }, process.env, {
    LAUNCH_URL: base,
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_VIDEO: 'off',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
    WEBSHIP_AUTO_SETTLE: 'off',
  });
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    const timer = setTimeout(() => child.kill('SIGKILL'), 120000);
    child.on('exit', () => {
      clearTimeout(timer);
      const results = [];
      if (fs.existsSync(report) && fs.readFileSync(report, 'utf8').trim()) {
        for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
          for (const scenario of f.elements || []) {
            const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
            results.push({ name: scenario.name, failed });
          }
        }
      }
      resolve({ output: output.replace(/\u001b\[[0-9;]*m/g, ''), results });
    });
  });
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

server.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const problems = [];
  // The auto-settle is off in both runs: only this.smartSettle() waits.
  const extended = await run('extending', extending, [
    'Feature: A project World that extends PlaywrightWorld',
    '',
    '  @mobile',
    '  Scenario: The extended World keeps the viewport and settles a project step',
    '    Given I am on "/"',
    '    Then the World should be the project one',
    '    And the window should be 375 by 667',
    '    When I put one item in the cart',
    '    Then I should see "1 item" in the "#cart" element',
  ], base);
  if (extended.results.length !== 1) {
    problems.push(`The extended World ran ${extended.results.length} scenarios, not 1:\n${extended.output.slice(-1200)}`);
  } else if (extended.results[0].failed) {
    const f = extended.results[0].failed;
    problems.push(`The extended World: ${f.hidden ? 'a hook' : `"${f.keyword}${f.name}"`} ${f.result.status}: ${String(f.result.error_message || '').replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0]}`);
  }
  const replaced = await run('replacing', replacing, [
    'Feature: A World of its own',
    '',
    '  Scenario: A World set by the project alone',
    '    Given I am on "/"',
    '    Then I should see "World"',
  ], base);
  if (!/\[webship-js\] The World of this run does not extend PlaywrightWorld/.test(replaced.output)) {
    problems.push('A World that replaces PlaywrightWorld ran without a word about what it loses.');
  }
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (problems.length) {
    console.error('Extending the World:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('Extending the World: an extended PlaywrightWorld keeps the viewport tag and this.smartSettle(); a replacing World is reported.');
});
