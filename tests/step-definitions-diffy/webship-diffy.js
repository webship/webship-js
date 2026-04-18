'use strict';

// ---------------------------------------------------------------------------
// Webship-JS — Diffy visual-regression step definitions
//
// Talks directly to Diffy REST API (https://app.diffy.website/api/).
//
// Configuration: resolved per-scenario with this priority:
//   1. process.env.DIFFY_*            (CI / shell — highest)
//   2. cucumber.js worldParameters.diffy.*   (project-level defaults)
//   3. built-in defaults
//
// Supported env vars / worldParameters keys:
//   DIFFY_API_KEY         apiKey          — https://app.diffy.website/#/keys
//   DIFFY_PROJECT_ID      projectId       — Diffy project id
//   DIFFY_BREAKPOINTS     breakpoints     — comma list, e.g. "640,1200"
//   DIFFY_WINDOW_HEIGHT   windowHeight    — default 2000
//   DIFFY_SCREENSHOTS_DIR screenshotsDir  — on-disk copy of screenshots
//   DIFFY_API_BASE_URL    baseUrl         — default app.diffy.website
//   DIFFY_MAX_WAIT        maxWait         — diff polling timeout (s), default 1200
//   DIFFY_ENV1_URL        env1Url         — custom URL for "compare diffy"
//   DIFFY_ENV2_URL        env2Url         — custom URL for "compare diffy"
// ---------------------------------------------------------------------------

const { Given, When, Then, Before } = require('@cucumber/cucumber');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const WINDOW_PADDING = 8;

function pick(envVal, paramVal, fallback) {
  if (envVal !== undefined && envVal !== '') return envVal;
  if (paramVal !== undefined && paramVal !== '' && paramVal !== null) return paramVal;
  return fallback;
}

function resolveConfig(parameters) {
  const p = (parameters && parameters.diffy) || {};
  const breakpointsRaw = pick(process.env.DIFFY_BREAKPOINTS, p.breakpoints, '1200');
  return {
    apiKey: pick(process.env.DIFFY_API_KEY, p.apiKey, ''),
    projectId: parseInt(pick(process.env.DIFFY_PROJECT_ID, p.projectId, '0'), 10),
    breakpoints: String(breakpointsRaw)
      .split(',')
      .map(s => parseInt(String(s).trim(), 10))
      .filter(n => !Number.isNaN(n)),
    windowHeight: parseInt(pick(process.env.DIFFY_WINDOW_HEIGHT, p.windowHeight, '2000'), 10),
    screenshotsDir: pick(process.env.DIFFY_SCREENSHOTS_DIR, p.screenshotsDir, ''),
    baseUrl: pick(process.env.DIFFY_API_BASE_URL, p.baseUrl, 'https://app.diffy.website/api/'),
    maxWait: parseInt(pick(process.env.DIFFY_MAX_WAIT, p.maxWait, '1200'), 10),
    env1Url: pick(process.env.DIFFY_ENV1_URL, p.env1Url, ''),
    env2Url: pick(process.env.DIFFY_ENV2_URL, p.env2Url, ''),
  };
}

let diffyToken = null;

async function refreshToken(cfg) {
  if (!cfg.apiKey) {
    throw new Error('Diffy API key missing. Set DIFFY_API_KEY env or worldParameters.diffy.apiKey.');
  }
  const res = await axios.post(
    cfg.baseUrl + 'auth/key',
    { key: cfg.apiKey },
    { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } }
  );
  if (!res.data || !res.data.token) {
    throw new Error('Diffy auth/key did not return a token.');
  }
  diffyToken = res.data.token;
  return diffyToken;
}

async function diffyRequest(cfg, method, uri, opts = {}) {
  if (!diffyToken) await refreshToken(cfg);
  const headers = Object.assign(
    { Authorization: 'Bearer ' + diffyToken },
    opts.headers || {}
  );
  const reqCfg = { method, url: cfg.baseUrl + uri, headers };
  if (opts.json !== undefined) {
    reqCfg.data = opts.json;
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }
  if (opts.form !== undefined) {
    reqCfg.data = opts.form;
    headers['Accept'] = 'application/json';
  }
  let res;
  try {
    res = await axios.request(reqCfg);
  } catch (e) {
    const body = e.response && e.response.data;
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const err = new Error(`Diffy API ${method} ${uri} failed: ${e.response?.status} ${bodyStr || e.message}`);
    err.cause = e;
    throw err;
  }
  return res.data;
}

function ensureProjectId(cfg) {
  if (!cfg.projectId) {
    throw new Error('Diffy projectId missing. Set DIFFY_PROJECT_ID env or worldParameters.diffy.projectId.');
  }
}

function currentPath(page, launchUrl) {
  try {
    const current = page.url();
    if (launchUrl && current.startsWith(launchUrl)) {
      return current.slice(launchUrl.length) || '/';
    }
    const u = new URL(current);
    return u.pathname + u.search;
  } catch {
    return '/';
  }
}

async function takeOneScreenshot(world) {
  const cfg = world.diffyConfig;
  const page = world.page;
  const viewport = page.viewportSize() || { width: cfg.breakpoints[0] || 1200 };
  const breakpoint = viewport.width - WINDOW_PADDING;
  const buffer = await page.screenshot({ fullPage: true });
  const url = currentPath(page, world.launchUrl);

  if (cfg.screenshotsDir) {
    if (!fs.existsSync(cfg.screenshotsDir)) {
      fs.mkdirSync(cfg.screenshotsDir, { recursive: true });
    }
    const safe = encodeURIComponent(url);
    const filename = `${Date.now()}__${safe}__${breakpoint}.png`;
    fs.writeFileSync(path.join(cfg.screenshotsDir, filename), buffer);
  }

  world.diffyScreenshots = world.diffyScreenshots || [];
  world.diffyScreenshots.push({ buffer, url, breakpoint });
}

Before(async function () {
  this.diffyConfig = resolveConfig(this.parameters);
  this.diffyScreenshots = [];
  this.diffyCreatedScreenshotIds = this.diffyCreatedScreenshotIds || [];
  this.diffyCreatedDiffIds = this.diffyCreatedDiffIds || [];
});

/**
 * Resize browser viewport to a breakpoint width (plus Diffy window padding).
 *
 * Example #1: When I resize window to "1200"
 * Example #2: When we resize window to "640"
 * Example #3: When I resize window to "320"
 * Example #4: When we resize window to "768"
 * Example #5: When I resize window to "1024"
 * Example #6: When we resize window to "1440"
 * Example #7: When I resize window to "1920"
 * Example #8: When we resize window to "375"
 *
 */
When(/^(?:I |we )?resize window to "([^"]*)"$/, async function (breakpoint) {
  const cfg = this.diffyConfig;
  const width = parseInt(breakpoint, 10) + WINDOW_PADDING;
  await this.page.setViewportSize({ width, height: cfg.windowHeight });
});

/**
 * Capture a full-page screenshot at current viewport.
 * Held in-memory (and optionally written to DIFFY_SCREENSHOTS_DIR) until
 * "send screenshots to diffy with name" uploads the batch.
 *
 * Example #1: Then I take screenshot
 * Example #2: Then we take screenshot
 * Example #3: And I take screenshot
 *
 */
Then(/^(?:I |we )?take screenshot$/, async function () {
  await takeOneScreenshot(this);
});

/**
 * Resize to each configured breakpoint and capture a screenshot per breakpoint.
 * Breakpoints come from DIFFY_BREAKPOINTS env or worldParameters.diffy.breakpoints.
 *
 * Example #1: Then I take screenshots for all breakpoints
 * Example #2: Then we take screenshots for all breakpoints
 * Example #3: And I take screenshots for all breakpoints
 *
 */
Then(/^(?:I |we )?take screenshots for all breakpoints$/, async function () {
  const cfg = this.diffyConfig;
  if (!cfg.breakpoints.length) {
    throw new Error('Diffy breakpoints empty. Set DIFFY_BREAKPOINTS or worldParameters.diffy.breakpoints.');
  }
  for (const bp of cfg.breakpoints) {
    await this.page.setViewportSize({
      width: bp + WINDOW_PADDING,
      height: cfg.windowHeight,
    });
    await takeOneScreenshot(this);
  }
});

/**
 * Upload all captured screenshots to Diffy as a named custom snapshot.
 * Clears in-memory buffer + on-disk screenshotsDir on success.
 *
 * Example #1: Then send screenshots to diffy with name "baseline"
 * Example #2: Then send screenshots to diffy with name "changed"
 * Example #3: Then send screenshots to diffy with name "homepage-release-2.0"
 * Example #4: Then send screenshots to diffy with name "after-deploy"
 * Example #5: Then send screenshots to diffy with name "smoke-run"
 * Example #6: Then send screenshots to diffy with name "webship.co-prod"
 *
 */
Then(/^send screenshots to diffy with name "([^"]*)"$/, async function (snapshotName) {
  const cfg = this.diffyConfig;
  ensureProjectId(cfg);
  const shots = this.diffyScreenshots || [];
  if (!shots.length) {
    throw new Error('No screenshots captured. Call "I take screenshot(s)" first.');
  }

  const form = new FormData();
  form.append('snapshotName', snapshotName);
  shots.forEach((s, i) => {
    form.append(`files[${i}]`, new Blob([s.buffer], { type: 'image/png' }), `screenshot-${i}.png`);
    form.append(`urls[${i}]`, s.url);
    form.append(`breakpoints[${i}]`, String(s.breakpoint));
  });

  const data = await diffyRequest(
    cfg,
    'POST',
    `projects/${cfg.projectId}/create-custom-snapshot`,
    { form }
  );

  const screenshotId = typeof data === 'object' ? (data.id || data.snapshotId || data) : data;
  this.diffyCreatedScreenshotIds.push(screenshotId);

  if (cfg.screenshotsDir && fs.existsSync(cfg.screenshotsDir)) {
    for (const f of fs.readdirSync(cfg.screenshotsDir)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(cfg.screenshotsDir, f));
    }
  }
  this.diffyScreenshots = [];
});

/**
 * Create a Diffy comparison (Diff) from the last two uploaded snapshots.
 *
 * Example #1: Then create diffy comparison
 * Example #2: And create diffy comparison
 *
 */
Then(/^create diffy comparison$/, async function () {
  const cfg = this.diffyConfig;
  ensureProjectId(cfg);
  const ids = this.diffyCreatedScreenshotIds || [];
  if (ids.length < 2) {
    throw new Error('Need at least two uploaded snapshots before creating a Diff.');
  }
  const data = await diffyRequest(cfg, 'POST', `projects/${cfg.projectId}/diffs`, {
    json: { snapshot1: ids[0], snapshot2: ids[1], name: '' },
  });
  const diffId = typeof data === 'object' ? (data.id || data.diffId || data) : data;
  this.diffyCreatedDiffIds.push(diffId);
});

/**
 * Create a named Diffy comparison from the last two uploaded snapshots.
 *
 * Example #1: Then create diffy comparison with name "release-2.0"
 * Example #2: Then create diffy comparison with name "nightly"
 * Example #3: Then create diffy comparison with name "smoke-run-42"
 * Example #4: Then create diffy comparison with name "webship.co-regression"
 * Example #5: Then create diffy comparison with name "before-vs-after"
 * Example #6: Then create diffy comparison with name "homepage-baseline-vs-changed"
 *
 */
Then(/^create diffy comparison with name "([^"]*)"$/, async function (name) {
  const cfg = this.diffyConfig;
  ensureProjectId(cfg);
  const ids = this.diffyCreatedScreenshotIds || [];
  if (ids.length < 2) {
    throw new Error('Need at least two uploaded snapshots before creating a Diff.');
  }
  const data = await diffyRequest(cfg, 'POST', `projects/${cfg.projectId}/diffs`, {
    json: { snapshot1: ids[0], snapshot2: ids[1], name },
  });
  const diffId = typeof data === 'object' ? (data.id || data.diffId || data) : data;
  this.diffyCreatedDiffIds.push(diffId);
});

/**
 * Ask Diffy to capture a snapshot remotely from a named environment on the project.
 * Accepts short (prod/stage/dev) or long (production/staging/development) forms, plus "custom".
 *
 * Example #1: Then create diffy screenshot from "production" environment
 * Example #2: Then create diffy screenshot from "prod" environment
 * Example #3: Then create diffy screenshot from "staging" environment
 * Example #4: Then create diffy screenshot from "stage" environment
 * Example #5: Then create diffy screenshot from "development" environment
 * Example #6: Then create diffy screenshot from "dev" environment
 * Example #7: Then create diffy screenshot from "custom" environment
 *
 */
Then(/^create diffy screenshot from "([^"]*)" environment$/, async function (environment) {
  const cfg = this.diffyConfig;
  ensureProjectId(cfg);
  const map = { prod: 'production', stage: 'staging', dev: 'development' };
  const env = map[environment] || environment;
  const allowed = ['production', 'staging', 'development', 'custom'];
  if (!allowed.includes(env)) {
    throw new Error(`Invalid Diffy environment "${environment}". Expected one of ${allowed.join(', ')}.`);
  }
  const data = await diffyRequest(
    cfg,
    'POST',
    `projects/${cfg.projectId}/screenshots`,
    { json: { environment: env } }
  );
  const screenshotId = typeof data === 'object' ? (data.id || data.snapshotId || data) : data;
  this.diffyCreatedScreenshotIds.push(screenshotId);
});

/**
 * Kick off a Diffy comparison between two project environments.
 * Uses DIFFY_ENV1_URL / DIFFY_ENV2_URL when either side is "custom".
 *
 * Example #1: Then compare diffy "prod" with "stage"
 * Example #2: Then compare diffy "production" with "staging"
 * Example #3: Then compare diffy "prod" with "dev"
 * Example #4: Then compare diffy "stage" with "dev"
 * Example #5: Then compare diffy "prod" with "baseline"
 * Example #6: Then compare diffy "baseline" with "custom"
 * Example #7: Then compare diffy "custom" with "custom"
 * Example #8: Then compare diffy "production" with "development"
 *
 */
Then(/^compare diffy "([^"]*)" with "([^"]*)"$/, async function (env1, env2) {
  const cfg = this.diffyConfig;
  ensureProjectId(cfg);
  const toShort = { production: 'prod', staging: 'stage', development: 'dev' };
  const e1 = toShort[env1] || env1;
  const e2 = toShort[env2] || env2;
  const allowed = ['prod', 'stage', 'dev', 'baseline', 'custom'];
  if (!allowed.includes(e1) || !allowed.includes(e2)) {
    throw new Error(`Invalid env. Allowed: ${allowed.join(', ')}.`);
  }
  const args = { env1: e1, env2: e2 };
  if (e1 === 'custom') args.env1Url = cfg.env1Url;
  if (e2 === 'custom') args.env2Url = cfg.env2Url;
  const data = await diffyRequest(cfg, 'POST', `projects/${cfg.projectId}/compare`, { json: args });
  const diffId = typeof data === 'object' ? (data.id || data.diffId || data) : data;
  this.diffyCreatedDiffIds.push(diffId);
});

/**
 * Upload every PNG/WebP under a local folder as a named Diffy custom snapshot.
 * Breakpoint is read from the PNG width; URL slug is derived from file name.
 *
 * Example #1: Then upload folder "./screenshots/baseline" to diffy as "baseline"
 * Example #2: Then upload folder "./screenshots/changed" to diffy as "changed"
 * Example #3: Then upload folder "./reports/screenshots" to diffy as "nightly"
 * Example #4: Then upload folder "/tmp/webship-shots" to diffy as "webship.co-snapshot"
 * Example #5: Then upload folder "./out/homepage" to diffy as "homepage-release-2.0"
 * Example #6: Then upload folder "./diffy/before" to diffy as "before-deploy"
 *
 */
Then(/^upload folder "([^"]*)" to diffy as "([^"]*)"$/, async function (folderPath, snapshotName) {
  const cfg = this.diffyConfig;
  ensureProjectId(cfg);
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    throw new Error(`Folder not found: ${folderPath}`);
  }
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(png|webp)$/i.test(entry.name)) files.push(full);
    }
  })(folderPath);
  if (!files.length) throw new Error(`No PNG/WebP images in ${folderPath}.`);
  files.sort();

  const form = new FormData();
  form.append('snapshotName', snapshotName);
  form.append('functionalTest', '1');
  files.forEach((filepath, i) => {
    const buffer = fs.readFileSync(filepath);
    const rel = path.relative(folderPath, filepath).replace(/[\\/]/g, '-');
    const slug = '/' + path.parse(rel).name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const width = detectPngWidth(buffer);
    if (!width) throw new Error(`Cannot read width: ${filepath}`);
    form.append(`files[${i}]`, new Blob([buffer], { type: 'image/png' }), path.basename(filepath));
    form.append(`urls[${i}]`, slug);
    form.append(`breakpoints[${i}]`, String(width));
  });

  const data = await diffyRequest(
    cfg,
    'POST',
    `projects/${cfg.projectId}/create-custom-snapshot`,
    { form }
  );
  const screenshotId = typeof data === 'object' ? (data.id || data.snapshotId || data) : data;
  this.diffyCreatedScreenshotIds.push(screenshotId);
});

function detectPngWidth(buffer) {
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50) return 0;
  return buffer.readUInt32BE(16);
}

/**
 * Poll the last created Diffy comparison until it reaches a terminal state.
 * Timeout is DIFFY_MAX_WAIT seconds (default 1200).
 *
 * Example #1: Then wait for diffy comparison to complete
 * Example #2: And wait for diffy comparison to complete
 *
 */
Then(/^wait for diffy comparison to complete$/, { timeout: 60 * 60 * 1000 }, async function () {
  const cfg = this.diffyConfig;
  const ids = this.diffyCreatedDiffIds || [];
  if (!ids.length) throw new Error('No Diffy comparison created yet.');
  const diffId = ids[ids.length - 1];
  const step = 10;
  const completed = new Set([2, 3, 4, 7]);
  for (let i = 0; i < cfg.maxWait; i += step) {
    const data = await diffyRequest(cfg, 'GET', `diffs/${diffId}`);
    if (data && completed.has(Number(data.state))) return;
    await new Promise(r => setTimeout(r, step * 1000));
  }
  throw new Error(`Diffy comparison ${diffId} did not complete in ${cfg.maxWait}s.`);
});
