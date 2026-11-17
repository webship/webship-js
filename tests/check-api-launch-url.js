#!/usr/bin/env node
'use strict';

// Checks that the relative API base URL (`Given the API base URL is "/"`)
// is joined to the launch URL of the run, `worldParameters.launchUrl`, the
// one every other step uses, and not to the LAUNCH_URL variable alone: the
// run below sets its launch URL in its config only, serves a folder of its
// own on a free port, and asks for a file that only that folder holds.
//
// Usage: node tests/check-api-launch-url.js   (npm run test:api-launch-url)

const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CUCUMBER = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');

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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-api-launch-url-'));
  const report = path.join(tmp, 'api.json');
  const config = path.join(tmp, 'cucumber.js');
  const feature = path.join(tmp, 'api.feature');
  const site = path.join(tmp, 'site');
  fs.mkdirSync(site);
  fs.writeFileSync(path.join(site, 'launch-url-check.json'), JSON.stringify({ served: 'by the launch URL of the config' }));
  const port = await freePort();
  const server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'http-server', 'bin', 'http-server'), site, '-p', String(port), '-a', '127.0.0.1', '-s'], { stdio: 'ignore' });
  const problems = [];
  try {
    if (!await waitForPort(port, 15000)) throw new Error(`the examples server did not start on port ${port}`);
    fs.writeFileSync(feature, [
      'Feature: The API base URL and the launch URL',
      '',
      '  Scenario: A relative base URL is joined to the launch URL of the config',
      '    Given the API base URL is "/"',
      '    When I send a GET request to "/launch-url-check.json"',
      '    Then the API response code should be 200',
      '     And the JSON response should have "served" equal to "by the launch URL of the config"',
      '',
    ].join('\n'));
    const base = require(path.join(ROOT, 'cucumber.js')).default;
    const world = JSON.parse(JSON.stringify(base.worldParameters));
    world.launchUrl = `http://127.0.0.1:${port}`;
    fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
      requireModule: base.requireModule,
      require: base.require,
      paths: [feature],
      format: [`json:${report}`],
      worldParameters: world,
    }) + ' };');
    const env = Object.assign({ SLOW_MO: '0' }, process.env, { WEBSHIP_REPORT_DISABLE: '1', WEBSHIP_VIDEO: 'off', WEBSHIP_JS_ERROR_MODE: 'off', FORCE_COLOR: '0' });
    delete env.LAUNCH_URL;
    const run = spawnSync(process.execPath, [path.join(CUCUMBER, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env,
    });
    const steps = fs.existsSync(report)
      ? JSON.parse(fs.readFileSync(report, 'utf8')).flatMap((f) => (f.elements || []).flatMap((s) => s.steps || [])).filter((s) => !s.hidden)
      : [];
    const failed = steps.find((s) => s.result.status !== 'passed');
    if (!steps.length) problems.push(`the run wrote no report:\n${run.stdout}\n${run.stderr}`);
    else if (failed) problems.push(`"${failed.name}" ${failed.result.status}: ${String(failed.result.error_message || '').split('\n').slice(0, 3).join(' ')}`);
  } finally {
    server.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (problems.length) {
    console.error('The relative API base URL does not follow the launch URL of the config:\n  - ' + problems.join('\n  - '));
    process.exit(1);
  }
  console.log('The relative API base URL follows the launch URL of the config (worldParameters.launchUrl).');
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
