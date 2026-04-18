'use strict';

// ---------------------------------------------------------------------------
// Webship-JS — Screenshot step definitions
//
// Saves PNG (and matching .html) screenshots to a configurable directory.
// Supports manual steps, automatic capture on failed step, and per-step
// capture for scenarios tagged @screenshots.
//
// Configuration: resolved per-scenario with this priority:
//   1. process.env.WEBSHIP_SCREENSHOT_*        (CI / shell — highest)
//   2. cucumber.js worldParameters.screenshot.*   (project-level defaults)
//   3. built-in defaults
//
// Supported env vars / worldParameters keys:
//   WEBSHIP_SCREENSHOT_DIR           dir                    default "./screenshots"
//   WEBSHIP_SCREENSHOT_PURGE         purge                  "true"/"false" — default false
//   WEBSHIP_SCREENSHOT_ON_FAILED     onFailed               default true
//   WEBSHIP_SCREENSHOT_ON_EVERY_STEP onEveryStep            default false
//   WEBSHIP_SCREENSHOT_FULLSCREEN    alwaysFullscreen       default false
//   WEBSHIP_SCREENSHOT_FAILED_PREFIX failedPrefix           default "failed_"
//   WEBSHIP_SCREENSHOT_PATTERN       filenamePattern        default "{datetime}.{feature_file}.feature_{step_line}.{ext}"
//   WEBSHIP_SCREENSHOT_PATTERN_FAIL  filenamePatternFailed  default "{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}"
//   WEBSHIP_SCREENSHOT_INFO_TYPES    infoTypes              comma list: url,feature,step,datetime
// ---------------------------------------------------------------------------

const { When, Then, Before, After, AfterStep, BeforeAll } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');

function pick(envVal, paramVal, fallback) {
  if (envVal !== undefined && envVal !== '') return envVal;
  if (paramVal !== undefined && paramVal !== '' && paramVal !== null) return paramVal;
  return fallback;
}

function asBool(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function resolveConfig(parameters) {
  const p = (parameters && parameters.screenshot) || {};
  return {
    dir: pick(process.env.WEBSHIP_SCREENSHOT_DIR, p.dir, './screenshots'),
    purge: asBool(pick(process.env.WEBSHIP_SCREENSHOT_PURGE, p.purge, undefined), false),
    onFailed: asBool(pick(process.env.WEBSHIP_SCREENSHOT_ON_FAILED, p.onFailed, undefined), true),
    onEveryStep: asBool(pick(process.env.WEBSHIP_SCREENSHOT_ON_EVERY_STEP, p.onEveryStep, undefined), false),
    alwaysFullscreen: asBool(pick(process.env.WEBSHIP_SCREENSHOT_FULLSCREEN, p.alwaysFullscreen, undefined), false),
    failedPrefix: pick(process.env.WEBSHIP_SCREENSHOT_FAILED_PREFIX, p.failedPrefix, 'failed_'),
    filenamePattern: pick(
      process.env.WEBSHIP_SCREENSHOT_PATTERN,
      p.filenamePattern,
      '{datetime}.{feature_file}.feature_{step_line}.{ext}'
    ),
    filenamePatternFailed: pick(
      process.env.WEBSHIP_SCREENSHOT_PATTERN_FAIL,
      p.filenamePatternFailed,
      '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}'
    ),
    infoTypes: String(pick(process.env.WEBSHIP_SCREENSHOT_INFO_TYPES, p.infoTypes, ''))
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Filename tokenizer
// ---------------------------------------------------------------------------
function pad(n, w) {
  const s = String(n);
  return s.length >= w ? s : '0'.repeat(w - s.length) + s;
}

function formatDate(d, format) {
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1, 2);
  const dd = pad(d.getDate(), 2);
  const HH = pad(d.getHours(), 2);
  const mm = pad(d.getMinutes(), 2);
  const ss = pad(d.getSeconds(), 2);
  if (!format || format === 'Ymd_His') return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
  return format
    .replace(/YYYY/g, yyyy)
    .replace(/MM/g, MM)
    .replace(/DD/g, dd)
    .replace(/HH/g, HH)
    .replace(/mm/g, mm)
    .replace(/ss/g, ss);
}

function urlToken(url, qualifier) {
  if (!url) return '';
  let parsed;
  try { parsed = new URL(url); } catch { return url; }
  let out;
  switch (qualifier) {
    case 'origin': out = `${parsed.protocol}//${parsed.host}`; break;
    case 'domain': out = parsed.host; break;
    case 'path': out = parsed.pathname.replace(/^\/+|\/+$/g, ''); break;
    case 'query': out = parsed.search.replace(/^\?/, ''); break;
    case 'fragment': out = parsed.hash.replace(/^#/, ''); break;
    case 'relative':
      out = parsed.pathname.replace(/^\/+|\/+$/g, '') + parsed.search + parsed.hash;
      break;
    default: out = url;
  }
  return out.replace(/[^\w\-]+/g, '_');
}

function replaceTokens(pattern, data) {
  return pattern.replace(/\{([^}]+)\}/g, (match, raw) => {
    const [head, format] = raw.split(':');
    const parts = head.split('_');
    const name = parts.shift();
    const qualifier = parts.join('_') || null;

    if (name === 'ext') return data.ext || 'html';
    if (name === 'failed' && qualifier === 'prefix') return data.failed_prefix || match;
    if (name === 'feature' && qualifier === 'file') {
      return data.feature_file ? path.basename(data.feature_file, '.feature') : match;
    }
    if (name === 'step') {
      if (qualifier === 'line') {
        const n = Number(data.step_line);
        if (Number.isNaN(n)) return match;
        // sprintf-like: {step_line:%03d}
        if (format && /^%\d*d$/.test(format)) {
          const w = parseInt(format.match(/\d+/)?.[0] || '0', 10);
          return pad(n, w);
        }
        return String(n);
      }
      if (qualifier === 'name' && data.step_name) {
        return String(data.step_name).replace(/[ "]+/g, c => (c === '"' ? '' : '_'));
      }
      return match;
    }
    if (name === 'url') return urlToken(data.url, qualifier);
    if (name === 'datetime') return data.timestamp ? formatDate(new Date(data.timestamp), format) : match;
    return match;
  });
}

// ---------------------------------------------------------------------------
// State tracked per-scenario
// ---------------------------------------------------------------------------
let purgedOnce = false;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function purgeDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
    else fs.unlinkSync(full);
  }
}

function buildInfo(cfg, ctx) {
  const lines = [];
  for (const type of cfg.infoTypes) {
    if (type === 'url' && ctx.url) lines.push(`Current URL: ${ctx.url}`);
    if (type === 'feature' && ctx.featureTitle) lines.push(`Feature: ${ctx.featureTitle}`);
    if (type === 'step' && ctx.stepText) lines.push(`Step: ${ctx.stepText} (line ${ctx.stepLine || '?'})`);
    if (type === 'datetime') lines.push(`Datetime: ${formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')}`);
  }
  return lines.join('\n');
}

function makeFileName(cfg, ctx, ext, explicitName, isFailed) {
  let pattern;
  if (isFailed) pattern = cfg.filenamePatternFailed;
  else if (explicitName) pattern = explicitName;
  else pattern = cfg.filenamePattern;

  if (!pattern.endsWith('.{ext}')) pattern += '.{ext}';

  return replaceTokens(pattern, {
    ext,
    failed_prefix: cfg.failedPrefix,
    feature_file: ctx.featureFile,
    step_line: ctx.stepLine,
    step_name: ctx.stepText,
    timestamp: Date.now(),
    url: ctx.url,
  });
}

async function captureScreenshot(world, options = {}) {
  const cfg = resolveConfig(world.parameters);
  if (!world.page) return;

  const fullscreen = Boolean(options.fullscreen || cfg.alwaysFullscreen);
  const ctx = world.__screenshotCtx || {};

  let url = '';
  try { url = world.page.url(); } catch { /* page closed */ }
  ctx.url = url;

  ensureDir(cfg.dir);

  // HTML capture (works for all drivers, Playwright content()).
  try {
    let html = await world.page.content();
    const info = buildInfo(cfg, ctx);
    if (info) html = info.replace(/\n/g, '<br/>\n') + '<hr/>\n' + html;
    const htmlName = makeFileName(cfg, ctx, 'html', options.filename, options.isFailed);
    fs.writeFileSync(path.join(cfg.dir, htmlName), html);
  } catch { /* no content yet */ }

  // PNG capture.
  try {
    const pngName = makeFileName(cfg, ctx, 'png', options.filename, options.isFailed);
    await world.page.screenshot({
      path: path.join(cfg.dir, pngName),
      fullPage: fullscreen,
    });
  } catch { /* driver without screenshot support */ }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
BeforeAll(function () {
  const cfg = resolveConfig(this && this.parameters);
  if (cfg.purge && !purgedOnce) {
    purgeDir(cfg.dir);
    purgedOnce = true;
  }
});

Before(function (scenario) {
  const pickledTags = (scenario.pickle && scenario.pickle.tags) || [];
  this.__screenshotCtx = {
    hasScreenshotsTag: pickledTags.some(t => t.name === '@screenshots'),
    featureFile: (scenario.gherkinDocument && scenario.gherkinDocument.uri) || '',
    featureTitle: (scenario.gherkinDocument && scenario.gherkinDocument.feature && scenario.gherkinDocument.feature.name) || '',
    stepText: '',
    stepLine: 0,
    url: '',
  };
});

AfterStep(async function (step) {
  if (!this.__screenshotCtx) return;
  this.__screenshotCtx.stepText = (step.pickleStep && step.pickleStep.text) || '';
  this.__screenshotCtx.stepLine = step.pickleStep && step.pickleStep.astNodeIds ? 0 : 0;

  if (step.gherkinDocument && step.pickleStep) {
    const astIds = step.pickleStep.astNodeIds || [];
    const steps = [];
    (step.gherkinDocument.feature.children || []).forEach(child => {
      const container = child.scenario || child.background;
      if (container && container.steps) steps.push(...container.steps);
    });
    const match = steps.find(s => astIds.includes(s.id));
    if (match && match.location) this.__screenshotCtx.stepLine = match.location.line;
  }

  const cfg = resolveConfig(this.parameters);
  const passed = step.result && step.result.status === 'PASSED';

  if (!passed && cfg.onFailed) {
    await captureScreenshot(this, { isFailed: true, fullscreen: cfg.alwaysFullscreen });
    return;
  }
  if (passed && (cfg.onEveryStep || this.__screenshotCtx.hasScreenshotsTag)) {
    await captureScreenshot(this, { fullscreen: cfg.alwaysFullscreen });
  }
});

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

/**
 * Save a screenshot at the current viewport size.
 *
 * Example #1: Then I save screenshot
 * Example #2: When I save screenshot
 * Example #3: Then save screenshot
 * Example #4: Given I am on "/about-us"
 *             Then I save screenshot
 * Example #5: When I go to homepage
 *             Then I save screenshot
 * Example #6: Given I am on "/news"
 *             When I scroll to "#latest"
 *             Then I save screenshot
 * Example #7: Given I am on "/contact"
 *             When I fill in "email" with "info@webship.co"
 *             Then I save screenshot
 * Example #8: Given I am on "/search?q=UN"
 *             Then I save screenshot
 * Example #9: Then I reload page
 *             Then I save screenshot
 * Example #10: Given I am on "/partners/un.org"
 *              Then I save screenshot
 */
When(/^I save screenshot$/, async function () {
  await captureScreenshot(this, {});
});
When(/^save screenshot$/, async function () {
  await captureScreenshot(this, {});
});

/**
 * Save a full-page screenshot (entire scrollable area).
 *
 * Example #1: Then I save fullscreen screenshot
 * Example #2: When I save fullscreen screenshot
 * Example #3: Then save fullscreen screenshot
 * Example #4: Given I am on "/news"
 *             Then I save fullscreen screenshot
 * Example #5: Given I am on "/about-us"
 *             Then I save fullscreen screenshot
 * Example #6: Given I am on homepage
 *             Then I save fullscreen screenshot
 * Example #7: Given I am on "/partners"
 *             When I wait 2 seconds
 *             Then I save fullscreen screenshot
 * Example #8: Given I am on "/webship"
 *             Then I save fullscreen screenshot
 * Example #9: Given I am on "/un.org/reports"
 *             Then I save fullscreen screenshot
 * Example #10: Given I am on "/long-article"
 *              Then I save fullscreen screenshot
 */
When(/^I save fullscreen screenshot$/, async function () {
  await captureScreenshot(this, { fullscreen: true });
});
When(/^save fullscreen screenshot$/, async function () {
  await captureScreenshot(this, { fullscreen: true });
});

/**
 * Resize the viewport to <width> x <height> then save a screenshot.
 *
 * Example #1: Then I save 1440 x 900 screenshot
 * Example #2: Then I save 1200 x 800 screenshot
 * Example #3: Then I save 375 x 667 screenshot
 * Example #4: Then I save 768 x 1024 screenshot
 * Example #5: Then I save 1920 x 1080 screenshot
 * Example #6: Given I am on "/about-us"
 *             Then I save 1440 x 900 screenshot
 * Example #7: Given I am on homepage
 *             Then I save 375 x 812 screenshot
 * Example #8: Given I am on "/news"
 *             Then I save 1024 x 768 screenshot
 * Example #9: Given I am on "/webship.co"
 *             Then I save 1366 x 768 screenshot
 * Example #10: Given I am on "/un.org"
 *              Then I save 414 x 896 screenshot
 */
When(/^I save (\d+) x (\d+) screenshot$/, async function (width, height) {
  await this.page.setViewportSize({ width: parseInt(width, 10), height: parseInt(height, 10) });
  await captureScreenshot(this, {});
});
When(/^save (\d+) x (\d+) screenshot$/, async function (width, height) {
  await this.page.setViewportSize({ width: parseInt(width, 10), height: parseInt(height, 10) });
  await captureScreenshot(this, {});
});

/**
 * Resize the viewport to <width> x <height> then save a full-page screenshot.
 *
 * Example #1: Then I save fullscreen 1440 x 900 screenshot
 * Example #2: Then I save fullscreen 1200 x 800 screenshot
 * Example #3: Then I save fullscreen 375 x 667 screenshot
 * Example #4: Then I save fullscreen 768 x 1024 screenshot
 * Example #5: Then I save fullscreen 1920 x 1080 screenshot
 * Example #6: Given I am on "/about-us"
 *             Then I save fullscreen 1440 x 900 screenshot
 * Example #7: Given I am on homepage
 *             Then I save fullscreen 375 x 812 screenshot
 * Example #8: Given I am on "/webship.co"
 *             Then I save fullscreen 1366 x 768 screenshot
 * Example #9: Given I am on "/un.org"
 *             Then I save fullscreen 414 x 896 screenshot
 * Example #10: Given I am on "/long-article"
 *              Then I save fullscreen 1440 x 900 screenshot
 */
When(/^I save fullscreen (\d+) x (\d+) screenshot$/, async function (width, height) {
  await this.page.setViewportSize({ width: parseInt(width, 10), height: parseInt(height, 10) });
  await captureScreenshot(this, { fullscreen: true });
});
When(/^save fullscreen (\d+) x (\d+) screenshot$/, async function (width, height) {
  await this.page.setViewportSize({ width: parseInt(width, 10), height: parseInt(height, 10) });
  await captureScreenshot(this, { fullscreen: true });
});

/**
 * Save a screenshot using an explicit filename (tokens supported).
 *
 * Example #1: Then I save screenshot with name "homepage.png"
 * Example #2: Then I save screenshot with name "webship-home"
 * Example #3: Then I save screenshot with name "un-landing-{datetime}.png"
 * Example #4: Then I save screenshot with name "about-us.png"
 * Example #5: Then I save screenshot with name "{feature_file}_{step_line}"
 * Example #6: Then I save screenshot with name "{url_path}.png"
 * Example #7: Given I am on "/news"
 *             Then I save screenshot with name "news-latest.png"
 * Example #8: Given I am on "/webship.co"
 *             Then I save screenshot with name "webship-index.png"
 * Example #9: Given I am on "/un.org"
 *             Then I save screenshot with name "un-home.png"
 * Example #10: Then I save screenshot with name "contact-form-before-submit.png"
 */
When(/^I save screenshot with name "([^"]*)"$/, async function (filename) {
  await captureScreenshot(this, { filename });
});
When(/^save screenshot with name "([^"]*)"$/, async function (filename) {
  await captureScreenshot(this, { filename });
});

/**
 * Save a full-page screenshot using an explicit filename (tokens supported).
 *
 * Example #1: Then I save fullscreen screenshot with name "homepage-full.png"
 * Example #2: Then I save fullscreen screenshot with name "webship-home-full"
 * Example #3: Then I save fullscreen screenshot with name "news-{datetime}.png"
 * Example #4: Then I save fullscreen screenshot with name "about-us-full.png"
 * Example #5: Then I save fullscreen screenshot with name "{feature_file}_full.png"
 * Example #6: Then I save fullscreen screenshot with name "{url_path}-full.png"
 * Example #7: Given I am on "/news"
 *             Then I save fullscreen screenshot with name "news-full.png"
 * Example #8: Given I am on "/webship.co"
 *             Then I save fullscreen screenshot with name "webship-full.png"
 * Example #9: Given I am on "/un.org"
 *             Then I save fullscreen screenshot with name "un-home-full.png"
 * Example #10: Then I save fullscreen screenshot with name "long-article-full.png"
 */
When(/^I save fullscreen screenshot with name "([^"]*)"$/, async function (filename) {
  await captureScreenshot(this, { filename, fullscreen: true });
});
When(/^save fullscreen screenshot with name "([^"]*)"$/, async function (filename) {
  await captureScreenshot(this, { filename, fullscreen: true });
});

module.exports = { resolveConfig, replaceTokens, makeFileName };
