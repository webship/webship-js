#!/usr/bin/env node
'use strict';

// Runs video-recording scenarios in three modes and checks the files they
// leave in the video folder:
//   - mode "on": "I start video recording" on a scenario that already
//     records leaves one video under its final name, no page@<hash>.webm;
//     the status in the name is in lower case; "print video path" prints
//     the path the video is saved under, not a temporary file;
//   - mode "on-failure": a passing scenario whose video has a reserved name
//     ("I save the current video as") keeps it, another passing one keeps none;
//   - mode "off": "I stop video recording" saves under the filename pattern;
//     WEBSHIP_VIDEO_SIZE sets the recording size.
//
// The scenarios write their own page, so no server is needed.
//
// Usage: node tests/check-video.js   (npm run test:video)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'webship-js-video-'));
const cucumber = path.join(ROOT, 'node_modules', '@cucumber', 'cucumber');
const steps = path.join(tmp, 'video.steps.js');
const defaults = require(path.join(ROOT, 'cucumber.js')).default;

fs.writeFileSync(steps, [
  `const { Given, Then } = require(${JSON.stringify(cucumber)});`,
  "Given('a page that reads {string}', async function (text) {",
  '  await this.page.setContent(`<h1>${text}</h1>`);',
  '});',
  "Then('the recording size should be {int} by {int}', function (width, height) {",
  '  const size = this._videoSettings && this._videoSettings.size;',
  '  if (!size || size.width !== width || size.height !== height) throw new Error(`The recording size is ${JSON.stringify(size)}.`);',
  '});',
  '',
].join('\n'));

const problems = [];
const strip = (text) => String(text || '').replace(/\u001b\[[0-9;]*m/g, '');

function run(name, mode, lines, extraEnv) {
  const dir = path.join(tmp, name);
  const videos = path.join(dir, 'videos');
  fs.mkdirSync(dir, { recursive: true });
  const feature = path.join(dir, `${name}.feature`);
  const report = path.join(dir, 'report.json');
  const config = path.join(dir, 'cucumber.js');
  fs.writeFileSync(feature, lines.join('\n') + '\n');
  const world = JSON.parse(JSON.stringify(defaults.worldParameters));
  world.video = Object.assign({}, world.video, { mode, dir: videos });
  fs.writeFileSync(config, 'module.exports = { default: ' + JSON.stringify({
    requireModule: defaults.requireModule,
    require: defaults.require.concat([steps]),
    paths: [feature],
    format: [`json:${report}`],
    worldParameters: world,
  }) + ' };');
  const env = Object.assign({ SLOW_MO: '0' }, process.env, {
    WEBSHIP_REPORT_DISABLE: '1',
    WEBSHIP_JS_ERROR_MODE: 'off',
    WEBSHIP_SCREENSHOT_ON_FAILED: 'false',
  }, extraEnv || {});
  delete env.WEBSHIP_VIDEO;
  delete env.WEBSHIP_VIDEO_DIR;
  if (!extraEnv || !extraEnv.WEBSHIP_VIDEO_SIZE) delete env.WEBSHIP_VIDEO_SIZE;
  const result = spawnSync(process.execPath, [path.join(cucumber, 'bin', 'cucumber.js'), '--config', path.relative(ROOT, config)], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180000,
    env,
  });
  if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) {
    problems.push(`${name}: the run wrote no report.\n${strip(result.stderr).slice(-1500)}`);
  } else {
    for (const f of JSON.parse(fs.readFileSync(report, 'utf8'))) {
      for (const scenario of f.elements || []) {
        const failed = (scenario.steps || []).find((step) => step.result && step.result.status !== 'passed');
        if (failed) problems.push(`${name}: "${scenario.name}": ${failed.hidden ? 'a hook' : `"${failed.keyword}${failed.name}"`} ${failed.result.status}: ${strip(failed.result.error_message).split('\n')[0]}`);
      }
    }
  }
  return {
    files: fs.existsSync(videos) ? fs.readdirSync(videos).sort() : [],
    videos,
    stdout: strip(result.stdout),
  };
}

// Mode "on".
const on = run('on', 'on', [
  'Feature: Recording that is on',
  '',
  '  Scenario: Starting a recording that is already on',
  '    Given a page that reads "One"',
  '    When I start video recording',
  '    And print video path',
  '    Then I should see "One"',
  '',
]);
if (on.files.some((f) => /^page@/.test(f))) problems.push(`on: a video was left under a temporary name: ${on.files.join(', ')}.`);
if (on.files.length !== 1) problems.push(`on: ${on.files.length} videos were saved, not 1: ${on.files.join(', ') || 'none'}.`);
else if (!/\.passed\.webm$/.test(on.files[0])) problems.push(`on: the video name does not end in ".passed.webm": ${on.files[0]}.`);
const printed = (on.stdout.match(/--- Video path: (\S+)/) || [])[1];
if (!printed) {
  problems.push('on: "print video path" printed no path.');
} else if (on.files.length === 1 && path.resolve(printed.replace('<status>', 'passed')) !== path.resolve(on.videos, on.files[0])) {
  problems.push(`on: "print video path" printed ${printed}, but the video was saved as ${path.join(on.videos, on.files[0])}.`);
}

// Mode "on-failure".
const onFailure = run('on-failure', 'on-failure', [
  'Feature: Recording kept on failure',
  '',
  '  Scenario: A passing scenario with a reserved video name',
  '    Given a page that reads "Kept"',
  '    When I save the current video as "kept.webm"',
  '    Then I should see "Kept"',
  '',
  '  Scenario: A passing scenario without one',
  '    Given a page that reads "Dropped"',
  '    Then I should see "Dropped"',
  '',
]);
if (onFailure.files.join(',') !== 'kept.webm') problems.push(`on-failure: the folder holds ${onFailure.files.join(', ') || 'nothing'}, not only kept.webm.`);

// Mode "off", with a recording size from the environment.
const off = run('off', 'off', [
  'Feature: Recording started and stopped by steps',
  '',
  '  Scenario: Stop and save',
  '    When I start video recording',
  '    And a page that reads "Stopped"',
  '    When I stop video recording',
  '',
  '  Scenario: The recording size',
  '    When I start video recording',
  '    Then the recording size should be 640 by 360',
  '    When I stop video recording',
  '',
], { WEBSHIP_VIDEO_SIZE: '640x360' });
const stopped = off.files.filter((f) => /Stop_and_save/.test(f));
if (stopped.length !== 1 || !/\.off\.Stop_and_save\.manual\.webm$/.test(stopped[0])) {
  problems.push(`off: the stopped recording was saved as ${off.files.join(', ') || 'nothing'}, not under the filename pattern with the status "manual".`);
}

fs.rmSync(tmp, { recursive: true, force: true });
if (problems.length) {
  console.error('Video recording:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log('Video recording: final names in lower case, no temporary file left, the printed path is the saved one, reserved names kept on failure, stopped recordings named by the pattern, WEBSHIP_VIDEO_SIZE read.');
