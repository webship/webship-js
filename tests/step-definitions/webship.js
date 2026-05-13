'use strict';

const { setWorldConstructor, World, Before, After, BeforeStep, AfterStep, setDefaultTimeout } = require('@cucumber/cucumber');
const playwright = require('playwright');
const playwrightConfig = require(require('path').join(process.cwd(), 'playwright.config'));
const path = require('path');

// ---------------------------------------------------------------------------
// Output filter — strip noisy `✔ Before # ...` / `✔ After # ...` hook lines
// from cucumber-js's failure dump so tester-facing output stays focused on
// the failing step + hint. Disable with WEBSHIP_FILTER_HOOK_LINES=off.
// ---------------------------------------------------------------------------
if (process.env.WEBSHIP_FILTER_HOOK_LINES !== 'off') {
  const HOOK_LINE = /^\s*[✔✖✗⚠?-]\s+(?:Before|After|BeforeStep|AfterStep)\b.*$/;
  const wrap = (stream) => {
    const orig = stream.write.bind(stream);
    stream.write = (chunk, encoding, cb) => {
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        const filtered = text
          .split('\n')
          .filter((line) => !HOOK_LINE.test(line.replace(/\x1b\[[0-9;]*m/g, '')))
          .join('\n');
        return orig(filtered, encoding, cb);
      }
      return orig(chunk, encoding, cb);
    };
  };
  wrap(process.stdout);
  wrap(process.stderr);
}

// ===========================================================================
// Internal helpers (BBR smart settle, modal probes, selector + text utilities).
// Imported by every *.steps.js file via require('./webship'). Defined here
// rather than in a shared sub-module so there is a single, canonical entry
// point — `tests/step-definitions/webship.js`.
// ===========================================================================

/**
 * Shared shape of every Cucumber `this` (the World) at step time.
 *
 * @typedef {Object} WebshipWorld
 * @property {import('playwright').Page} [page]                  - Active page (set in Before hook).
 * @property {import('playwright').BrowserContext} [context]     - Active browser context.
 * @property {import('playwright').Browser} [browser]            - Active browser instance.
 * @property {import('playwright').FrameLocator} [frame]         - Active iframe scope (set by iframe steps).
 * @property {Object<string, string>} [__selectorsCss]           - Named CSS selectors (registry).
 * @property {Object<string, string>} [__selectorsXpath]         - Named XPath selectors (registry).
 * @property {Object} [parameters]                               - cucumber.js worldParameters.
 */

// ---------------------------------------------------------------------------
// BBR-style smart settle
//
// Behaviour-Based Robotics (BBR) principle: react to the environment, not
// the clock. smartSettle returns when the page is at the *edge* of activity,
// bounded by a budget so a runaway page cannot stall the run.
//
// The probe checks:
//   1. <body> attached
//   2. DOMContentLoaded fired
//   3. Playwright "networkidle" (500ms with no in-flight network)
//   4. window.__webshipAjaxCount === 0       (custom fetch/XHR counter)
//   5. window.__webshipPendingTimers === 0   (custom setTimeout counter)
//   6. Date.now() - window.__webshipLastMutation >= quietMs (DOM-quiet)
//
// Steps 4/5/6 are evaluated atomically via a single waitForFunction, so a
// late-firing setTimeout that mutates the DOM re-arms the wait correctly.
// ---------------------------------------------------------------------------

/**
 * Wait for the page to reach an "edge" of activity — DOM ready, network
 * idle, no pending AJAX or timers, and no DOM mutations for ≥250 ms.
 *
 * @param {import('playwright').Page} page    - Page being probed.
 * @param {number} [timeout=10000]            - Total budget in ms.
 * @returns {Promise<void>}
 */
async function smartSettle(page, timeout) {
  const total = typeof timeout === 'number' && timeout > 0 ? timeout : 10000;
  const deadline = Date.now() + total;
  const remaining = () => Math.max(0, deadline - Date.now());

  try { await page.waitForSelector('body', { state: 'attached', timeout: remaining() }); } catch { /* keep going */ }
  try { await page.waitForLoadState('domcontentloaded', { timeout: remaining() }); } catch { /* keep going */ }
  try { await page.waitForLoadState('networkidle', { timeout: remaining() }); } catch { /* keep going */ }
  try {
    await page.waitForFunction(
      (quietMs) => {
        const ajax = window.__webshipAjaxCount;
        const timers = window.__webshipPendingTimers;
        const last = window.__webshipLastMutation;
        if (typeof ajax === 'number' && ajax > 0) return false;
        if (typeof timers === 'number' && timers > 0) return false;
        if (typeof last === 'number' && Date.now() - last < quietMs) return false;
        return true;
      },
      250,
      { timeout: remaining(), polling: 50 }
    );
  } catch { /* keep going */ }
}

/**
 * Convenience alias for {@link smartSettle}. Kept for readability inside
 * navigation steps where "wait for page to load" reads more naturally.
 *
 * @param {import('playwright').Page} page
 * @param {number} [timeout]
 * @returns {Promise<void>}
 */
async function waitForPageLoad(page, timeout) {
  await smartSettle(page, timeout);
}

// ---------------------------------------------------------------------------
// Modal helpers — use the named "modal" selector from the registry, falling
// back to ARIA role + native <dialog>.
// ---------------------------------------------------------------------------
/**
 * Resolve the CSS selector that targets a modal dialog. Prefers a named
 * `modal` selector from the registry; otherwise falls back to ARIA + native.
 *
 * @param {WebshipWorld} world
 * @returns {string}
 */
function getModalSelector(world) {
  if (world && world.__selectorsCss && world.__selectorsCss['modal']) {
    return world.__selectorsCss['modal'];
  }
  return '[role="dialog"], dialog';
}

/**
 * Locator pointing at modal dialogs on the given page.
 *
 * @param {import('playwright').Page} page
 * @param {WebshipWorld} world
 * @returns {import('playwright').Locator}
 */
function getModalLocator(page, world) {
  return page.locator(getModalSelector(world));
}

/**
 * Wait until a modal is visible or hidden. Visibility is derived from
 * computed styles (display + visibility + opacity), which is more
 * reliable than `offsetParent` for fixed-position modal containers.
 *
 * @param {import('playwright').Page} page
 * @param {'visible'|'hidden'} state
 * @param {number} [timeout=10000]
 * @param {WebshipWorld} world
 * @returns {Promise<void>}
 */
async function waitForModalState(page, state, timeout, world) {
  const sel = getModalSelector(world);
  const total = typeof timeout === 'number' && timeout > 0 ? timeout : 10000;
  if (state === 'visible') {
    await page.waitForFunction(
      (s) => Array.from(document.querySelectorAll(s)).some((el) => {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
      }),
      sel, { timeout: total }
    );
  } else {
    await page.waitForFunction(
      (s) => !Array.from(document.querySelectorAll(s)).some((el) => {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
      }),
      sel, { timeout: total }
    );
  }
}

/**
 * Return the first visible modal locator. Throws a friendly error with
 * remediation hints when no modal is on screen.
 *
 * @param {import('playwright').Page} page
 * @param {WebshipWorld} world
 * @returns {Promise<import('playwright').Locator>}
 */
async function findVisibleModal(page, world) {
  const all = getModalLocator(page, world);
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    if (await all.nth(i).isVisible()) return all.nth(i);
  }
  const sel = getModalSelector(world);
  throw friendly(
    `No visible modal found.\n` +
    `  Selector tried: ${sel}\n` +
    `  Hint: did you "wait for the modal to appear" first?\n` +
    `  Or: register a custom "modal" CSS selector in tests/selectors/<preset>.json.`
  );
}

/**
 * Quick check — true when any element matching the modal selector is
 * visible per the same computed-style probe as `waitForModalState`.
 *
 * @param {import('playwright').Page} page
 * @param {WebshipWorld} world
 * @returns {Promise<boolean>}
 */
async function isAnyModalVisible(page, world) {
  const sel = getModalSelector(world);
  return page.evaluate((s) =>
    Array.from(document.querySelectorAll(s)).some((el) => {
      const cs = window.getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
    }),
    sel
  );
}

// ---------------------------------------------------------------------------
// Resilient CSS selector builder.
// Honors id (#x), class (.x), or attribute selectors ([x]) verbatim.
// Otherwise tries id / class / name / data-testid / data-test-id / data-test
// / data-cy / aria-label / value / placeholder / title in priority order.
// ---------------------------------------------------------------------------
/**
 * Compose a CSS selector that tries multiple addressable attributes.
 * Verbatim selectors (`#id`, `.class`, `[attr]`) pass through untouched;
 * bare names fan out across `name`, `data-testid`, `aria-label`, etc.
 *
 * @param {string} attrValue - Value to match (e.g. `"submit-btn"`).
 * @param {string} [attr]    - Optional explicit attribute name; when given, returns `[attr="value" i]`.
 * @returns {string} CSS selector union.
 */
function buildSelector(attrValue, attr) {
  const hasASpace = attrValue.indexOf(' ');
  if ((attrValue.startsWith('#') || attrValue.startsWith('.') || attrValue.startsWith('[')) && hasASpace === -1) {
    return attrValue;
  }
  if (!attr && hasASpace === -1) {
    return (
      attrValue +
      ',#' + attrValue +
      ',.' + attrValue +
      ',[name="' + attrValue + '"]' +
      ',[data-testid="' + attrValue + '"]' +
      ',[data-test-id="' + attrValue + '"]' +
      ',[data-test="' + attrValue + '"]' +
      ',[data-cy="' + attrValue + '"]' +
      ',[aria-label="' + attrValue + '"]' +
      ',[value="' + attrValue + '"]' +
      ',[placeholder="' + attrValue + '"]' +
      ',[title="' + attrValue + '"]'
    );
  }
  if (!attr && hasASpace > -1) {
    return '[value="' + attrValue + '"],[placeholder="' + attrValue + '"],[aria-label="' + attrValue + '"],[title="' + attrValue + '"]';
  }
  return '[' + attr + '="' + attrValue + '" i]';
}

// Navigate to a URL with friendly errors. Tolerates Firefox / WebKit
// empty-response edge cases so a redirect to about:blank or a 204 does
// not crash the suite. All other failures rethrow with extra context
// (URL + likely cause).
/**
 * Navigate to a URL with friendly error messages for common failures
 * (server down, DNS, empty response). All other errors rethrow with
 * preserved stack + extra context.
 *
 * @param {import('playwright').Page} page
 * @param {string} url
 * @returns {Promise<void>}
 */
async function gotoUrl(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (e) {
    const msg = e.message || '';
    // Empty response: harmless, swallow.
    if (/NS_ERROR_NET_EMPTY_RESPONSE|net::ERR_EMPTY_RESPONSE/.test(msg)) return;
    // Connection refused: server probably not running.
    if (/ECONNREFUSED|net::ERR_CONNECTION_REFUSED/.test(msg)) {
      throw friendly(
        `Could not reach "${url}".\n` +
        `  ${msg.split('\n')[0]}\n` +
        `  Hint: is your dev server running? Check LAUNCH_URL env var.`
      );
    }
    // DNS failure.
    if (/ERR_NAME_NOT_RESOLVED|NS_ERROR_UNKNOWN_HOST/.test(msg)) {
      throw friendly(
        `Could not resolve host for "${url}".\n` +
        `  ${msg.split('\n')[0]}\n` +
        `  Hint: double-check the hostname in LAUNCH_URL or your "Given I am on" path.`
      );
    }
    // Anything else — strip the stack trace too.
    throw friendly(`Failed to navigate to "${url}":\n  ${e.message}`);
  }
}

/**
 * Fill a form field located by label, placeholder, or `[name]`. Resolution
 * order: label → placeholder → name. Throws a friendly error when none
 * match, suggesting the by-attr variant.
 *
 * @param {import('playwright').Page} page
 * @param {string} field - Label / placeholder / name.
 * @param {string} value - Value to type.
 * @returns {Promise<void>}
 */
async function fillField(page, field, value) {
  const byLabel = page.getByLabel(field, { exact: true });
  if (await byLabel.count() > 0) {
    await byLabel.fill(value);
    return;
  }
  const byPlaceholder = page.getByPlaceholder(field, { exact: true });
  if (await byPlaceholder.count() > 0) {
    await byPlaceholder.fill(value);
    return;
  }
  const byName = page.locator(`[name="${field}"]`).first();
  if (await byName.count() > 0) {
    await byName.fill(value);
    return;
  }
  throw friendly(
    `Could not find a field for "${field}".\n` +
    `  Tried: getByLabel(exact), getByPlaceholder(exact), [name="${field}"].\n` +
    `  Hints: check the label/placeholder text matches exactly (case-sensitive),\n` +
    `         or use the attribute variant: 'I fill in "${field}" with "${value}" by attr'.`
  );
}

/**
 * Read text from a locator. Falls back to `textContent` when the element
 * is not an `<input>` / `<textarea>`.
 *
 * @param {import('playwright').Locator} locator
 * @returns {Promise<string>}
 */
async function getLocatorText(locator) {
  try {
    return await locator.inputValue();
  } catch {
    return await locator.textContent() || '';
  }
}

/**
 * Left-pad a number with zeros to the requested width.
 *
 * @param {number} n
 * @param {number} width
 * @returns {string}
 */
function pad(n, width) {
  const s = String(n);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

// ---------------------------------------------------------------------------
// Relative-date token resolver
//
// Replaces [relative:OFFSET] and [relative:OFFSET#FORMAT] tokens in step
// arguments before pattern matching. Resolution happens automatically via
// the BeforeStep hook registered below.
//
// OFFSET   any expression understood by parseRelativeOffset()
//          examples: "now", "-1 day", "+2 hours", "+1 week", "next monday"
// FORMAT   subset of date-fns-style tokens: YYYY, MM, DD, HH, mm, ss
//          examples: "YYYY-MM-DD", "DD/MM/YYYY HH:mm"
//
// Without FORMAT the resolved value is the Unix timestamp in seconds.
//
// Examples:
//   [relative:-1 day]              -> "1714867200"
//   [relative:-1 day#YYYY-MM-DD]   -> "2026-05-06"
// ---------------------------------------------------------------------------

const RELATIVE_TOKEN_RE = /\[relative:([^\]#]+)(?:#([^\]]+))?\]/g;

/**
 * Format a Date with a tiny token vocabulary (`YYYY`, `MM`, `DD`, `HH`,
 * `mm`, `ss`). Sufficient for typical step-arg date formats.
 *
 * @param {Date} date
 * @param {string} fmt
 * @returns {string}
 */
function formatRelativeDate(date, fmt) {
  return fmt
    .replace(/YYYY/g, date.getFullYear())
    .replace(/MM/g, pad(date.getMonth() + 1, 2))
    .replace(/DD/g, pad(date.getDate(), 2))
    .replace(/HH/g, pad(date.getHours(), 2))
    .replace(/mm/g, pad(date.getMinutes(), 2))
    .replace(/ss/g, pad(date.getSeconds(), 2));
}

/**
 * Parse a relative-date offset expression and return absolute ms.
 * Accepts `"now"`, `"+1 day"`, `"-2 hours"`, `"next monday"`, etc.
 *
 * @param {string} offset
 * @param {number} baseMs - Reference epoch in ms.
 * @returns {number} Resolved epoch in ms.
 */
function parseRelativeOffset(offset, baseMs) {
  const trimmed = offset.trim().toLowerCase();
  if (trimmed === 'now') return baseMs;

  const weekdayMatch = trimmed.match(/^(next|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (weekdayMatch) {
    const direction = weekdayMatch[1] === 'next' ? 1 : -1;
    const target = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(weekdayMatch[2]);
    const d = new Date(baseMs);
    let diff = (target - d.getDay()) * direction;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff * direction);
    return d.getTime();
  }

  const m = trimmed.match(/^([+-]?\d+)\s*(second|minute|hour|day|week|month|year)s?$/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const d = new Date(baseMs);
    switch (unit) {
      case 'second': d.setSeconds(d.getSeconds() + n); break;
      case 'minute': d.setMinutes(d.getMinutes() + n); break;
      case 'hour':   d.setHours(d.getHours() + n); break;
      case 'day':    d.setDate(d.getDate() + n); break;
      case 'week':   d.setDate(d.getDate() + n * 7); break;
      case 'month':  d.setMonth(d.getMonth() + n); break;
      case 'year':   d.setFullYear(d.getFullYear() + n); break;
    }
    return d.getTime();
  }

  const parsed = Date.parse(offset);
  if (!Number.isNaN(parsed)) return parsed;

  throw new Error(`Cannot evaluate relative date offset: "${offset}"`);
}

/**
 * Resolve `[relative:OFFSET]` / `[relative:OFFSET#FORMAT]` tokens in any
 * string. Without `#FORMAT` the token expands to a Unix timestamp in
 * seconds; with it, to the formatted string.
 *
 * @param {string} value - Step argument that may contain tokens.
 * @param {number} [nowMs=Date.now()] - Reference epoch for resolution.
 * @returns {string} Value with tokens replaced.
 */
function resolveRelativeDate(value, nowMs) {
  if (typeof value !== 'string' || !value.includes('[relative:')) return value;
  const base = nowMs || Date.now();
  return value.replace(RELATIVE_TOKEN_RE, (_, offset, fmt) => {
    const ms = parseRelativeOffset(offset, base);
    if (fmt) return formatRelativeDate(new Date(ms), fmt);
    return String(Math.floor(ms / 1000));
  });
}

// BeforeStep hook — transform every string argument (and DataTable cells)
// in the current pickle step before the step definition runs.
BeforeStep(function (scope) {
  const step = scope && scope.pickleStep;
  if (!step) return;

  if (typeof step.text === 'string' && step.text.includes('[relative:')) {
    step.text = resolveRelativeDate(step.text);
  }

  if (!step.argument) return;

  if (step.argument.docString && typeof step.argument.docString.content === 'string') {
    step.argument.docString.content = resolveRelativeDate(step.argument.docString.content);
  }

  if (step.argument.dataTable && Array.isArray(step.argument.dataTable.rows)) {
    for (const row of step.argument.dataTable.rows) {
      if (!row || !Array.isArray(row.cells)) continue;
      for (const cell of row.cells) {
        if (cell && typeof cell.value === 'string') {
          cell.value = resolveRelativeDate(cell.value);
        }
      }
    }
  }
});

/**
 * Translate a raw Playwright / Node / HTTP error message into one short,
 * plain-English sentence aimed at non-coder testers. Falls back to a
 * cleaned-up first line of the original when no pattern matches.
 *
 * @param {Error|string} err
 * @returns {string}
 */
function humanize(err) {
  const msg = typeof err === 'string' ? err : (err && err.message) || '';
  const first = msg.split('\n')[0].trim();
  // Common Playwright / Node patterns → plain English.
  const map = [
    [/Timeout\s+\d+ms\s+exceeded/i,                       'the page took too long to respond'],
    [/locator\.(click|press|fill|hover|dblclick|tap|focus|dispatchEvent|scrollIntoViewIfNeeded)/i,
                                                          'the element could not be reached'],
    [/strict mode violation/i,                            'the locator matched more than one element'],
    [/element is not visible/i,                           'the element is hidden or off-screen'],
    [/element is not attached/i,                          'the element was removed from the page'],
    [/element is not enabled/i,                           'the element is disabled'],
    [/element is outside of the viewport/i,               'the element is outside the visible area'],
    [/intercepts pointer events/i,                        'another element is on top of the target'],
    [/ECONNREFUSED|net::ERR_CONNECTION_REFUSED/i,         'the server is not running or refused the connection'],
    [/ERR_NAME_NOT_RESOLVED|NS_ERROR_UNKNOWN_HOST/i,      'the hostname could not be resolved'],
    [/ERR_HTTP_RESPONSE_CODE_FAILURE/i,                   'the page returned an HTTP error status'],
    [/ENOENT/i,                                           'the file could not be found'],
    [/EACCES|EPERM/i,                                     'the file is not readable or writable'],
    [/Invalid (regular expression|regex)/i,               'the regular expression is invalid'],
    [/Unexpected token|Unexpected end of JSON input/i,    'the JSON could not be parsed'],
    [/Target page, context or browser has been closed/i,  'the browser closed before the step finished'],
    [/page\.goto:/i,                                      'the page could not be opened'],
    [/frameLocator|content frame/i,                       'the iframe content was not ready'],
    [/Cookies? not found|Cookie .* not (set|found)/i,     'the cookie does not exist on this page'],
    [/setViewportSize/i,                                  'the viewport cannot be resized for this browser context'],
  ];
  for (const [re, plain] of map) {
    if (re.test(msg)) return plain;
  }
  // Strip noisy "Call log:" suffix common in Playwright errors.
  return first.replace(/^\w+\.\w+:\s*/, '').replace(/\s+Call log:.*$/i, '');
}

/**
 * Build a tester-friendly error.
 *
 * Three forms:
 *   1. `friendly(message)`                       — message becomes the stack.
 *   2. `friendly(message, err)`                  — appends "Why: <humanized>" + cleaned cause.
 *   3. `friendly({ action, target, hint, cause })` — builds a structured message.
 *
 * The Error's `.stack` is set to the rendered message, so cucumber-js does
 * not print a JS stack trace — only the lines we authored.
 *
 * @param {string|Object} input
 * @param {Error} [cause]
 * @returns {Error}
 */
function friendly(input, cause) {
  let body;
  if (typeof input === 'string') {
    body = input;
    if (cause) {
      body += `\n  Why: ${humanize(cause)}`;
    }
  } else if (input && typeof input === 'object') {
    const lines = [];
    if (input.action && input.target) lines.push(`Could not ${input.action} "${input.target}".`);
    else if (input.action)            lines.push(`Could not ${input.action}.`);
    else if (input.message)           lines.push(input.message);
    if (input.cause)                  lines.push(`  Why: ${humanize(input.cause)}`);
    if (input.hint)                   lines.push(`  Hint: ${input.hint}`);
    body = lines.join('\n');
  } else {
    body = String(input);
  }
  const e = new Error(body);
  e.stack = body;
  return e;
}

module.exports = {
  smartSettle,
  waitForPageLoad,
  getModalSelector,
  getModalLocator,
  waitForModalState,
  findVisibleModal,
  isAnyModalVisible,
  buildSelector,
  gotoUrl,
  fillField,
  getLocatorText,
  pad,
  resolveRelativeDate,
  parseRelativeOffset,
  formatRelativeDate,
  friendly,
  humanize,
};

// ---------------------------------------------------------------------------
// Auto HTML report on cucumber-js process exit.
// Disable: WEBSHIP_REPORT_DISABLE=1. Extra flags: WEBSHIP_REPORT_ARGS="--theme hierarchy --layout 2".
// Registered once per process.
// ---------------------------------------------------------------------------
if (!global.__WEBSHIP_AUTO_REPORT__) {
  global.__WEBSHIP_AUTO_REPORT__ = true;
  process.on('exit', () => {
    if (process.env.WEBSHIP_REPORT_DISABLE) return;
    try {
      const { run } = require(path.join(__dirname, '..', '..', 'bin', 'generate-reports'));
      const extra = (process.env.WEBSHIP_REPORT_ARGS || '').split(/\s+/).filter(Boolean);
      run(extra);
    } catch (err) {
      console.error('[webship-js] Report generation failed:', err.message);
    }
  });
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------
// Step timeout must exceed Playwright's 30s default so that locator timeouts
// (e.g. click() with no match) reach our try/catch wrappers BEFORE cucumber
// trips its own timeout — otherwise testers see "function timed out" instead
// of the friendly Why/Hint message.
setDefaultTimeout(45 * 1000);

class PlaywrightWorld extends World {
  constructor(options) {
    super(options);
    this.launchUrl = this.parameters.launchUrl;
    this.minWaitTime = this.parameters.minWaitTime;
    this.playwrightBrowser = null;
    this.context = null;
    this.page = null;
    this.assetsFolder = path.join(__dirname, '../assets/');
  }

  async openBrowser(extraContextOptions) {
    const { browser: browserName, launchOptions, contextOptions } = playwrightConfig;
    this.playwrightBrowser = await playwright[browserName].launch(launchOptions);
    const merged = Object.assign({}, contextOptions, extraContextOptions || {});
    this.context = await this.playwrightBrowser.newContext(merged);
    // BBR: install in-flight fetch/XHR counter on every page (init script runs
    // before any document script). The counter lets smartSettle() detect the
    // edge of background activity rather than guessing a fixed delay.
    await this.context.addInitScript(() => {
      if (window.__webshipAjaxInstalled) return;
      window.__webshipAjaxInstalled = true;
      window.__webshipAjaxCount = 0;
      window.__webshipPendingTimers = 0;
      window.__webshipLastMutation = Date.now();

      // Track in-flight fetch requests.
      const origFetch = window.fetch;
      if (typeof origFetch === 'function') {
        window.fetch = function (...args) {
          window.__webshipAjaxCount++;
          const p = origFetch.apply(this, args);
          const settle = () => { window.__webshipAjaxCount--; };
          p.then(settle, settle);
          return p;
        };
      }

      // Track in-flight XMLHttpRequests.
      const XHR = window.XMLHttpRequest;
      if (XHR && XHR.prototype) {
        const origSend = XHR.prototype.send;
        XHR.prototype.send = function (...args) {
          window.__webshipAjaxCount++;
          const settle = () => { window.__webshipAjaxCount--; };
          this.addEventListener('loadend', settle, { once: true });
          return origSend.apply(this, args);
        };
      }

      // Track pending setTimeout callbacks. Many client-side frameworks use
      // setTimeout to schedule UI updates (animation frames, throttled
      // re-renders, fade-out → display:none). BBR demands we wait for those
      // timers to drain rather than guess a fixed delay.
      const origSetTimeout = window.setTimeout;
      const origClearTimeout = window.clearTimeout;
      const liveTimers = new Set();
      if (typeof origSetTimeout === 'function') {
        window.setTimeout = function (cb, delay, ...args) {
          window.__webshipPendingTimers++;
          let id;
          const wrapped = function () {
            try {
              if (typeof cb === 'function') return cb.apply(this, args);
            } finally {
              if (liveTimers.delete(id)) window.__webshipPendingTimers--;
            }
          };
          id = origSetTimeout(wrapped, delay);
          liveTimers.add(id);
          return id;
        };
        if (typeof origClearTimeout === 'function') {
          window.clearTimeout = function (id) {
            if (liveTimers.delete(id)) window.__webshipPendingTimers--;
            return origClearTimeout(id);
          };
        }
      }

      // Track last DOM mutation so smartSettle can wait for the *edge* of
      // client-side rendering (animations, async hydration, transitions).
      const startObserver = () => {
        if (!document || !document.documentElement) return false;
        try {
          new MutationObserver(() => { window.__webshipLastMutation = Date.now(); })
            .observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
          return true;
        } catch (e) { return false; }
      };
      if (!startObserver()) {
        document.addEventListener('DOMContentLoaded', startObserver, { once: true });
      }
    });
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    if (this.playwrightBrowser) {
      await this.playwrightBrowser.close();
      this.playwrightBrowser = null;
      this.context = null;
      this.page = null;
    }
  }
}

setWorldConstructor(PlaywrightWorld);

// ---------------------------------------------------------------------------
// Video recording — Playwright records at browser-context creation. The
// helpers below resolve config + tags into either an empty {} (no
// recording) or { recordVideo: { dir, size } } that gets merged into the
// context options.
// ---------------------------------------------------------------------------

const VIDEO_MODES = new Set(['off', 'on', 'on-failure', 'tag']);

function videoSettings(world, scope) {
  const cfg = (world.parameters && world.parameters.video) || {};
  let mode = process.env.WEBSHIP_VIDEO || cfg.mode || 'off';
  if (!VIDEO_MODES.has(mode)) mode = 'off';
  return {
    mode,
    dir: process.env.WEBSHIP_VIDEO_DIR || cfg.dir || './videos',
    size: cfg.size || { width: 1280, height: 720 },
    filenamePattern: cfg.filenamePattern || '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
  };
}

function videoHasTag(scope, name) {
  return !!(scope && scope.pickle && Array.isArray(scope.pickle.tags) &&
            scope.pickle.tags.some((t) => t.name === name));
}

function shouldRecordAtStart(s, scope) {
  if (videoHasTag(scope, '@no-video')) return false;
  if (videoHasTag(scope, '@video')) return true;
  return s.mode === 'on' || s.mode === 'on-failure';
}

function sanitisePart(s) {
  return String(s || '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

function buildVideoFilename(template, scope, status) {
  const featurePath = (scope && scope.gherkinDocument && scope.gherkinDocument.uri) || 'unknown';
  const feature = (scope && scope.gherkinDocument && scope.gherkinDocument.feature && scope.gherkinDocument.feature.name) || 'feature';
  const scenario = (scope && scope.pickle && scope.pickle.name) || 'scenario';
  const featureFile = featurePath.split('/').pop().replace(/\.feature$/, '');
  const dt = new Date().toISOString().replace(/[:.]/g, '-');
  return template
    .replace('{datetime}', dt)
    .replace('{feature_file}', sanitisePart(featureFile))
    .replace('{feature}', sanitisePart(feature))
    .replace('{scenario}', sanitisePart(scenario))
    .replace('{status}', sanitisePart(status))
    .replace('{ext}', 'webm');
}

Before({ order: 5 }, async function (scope) {
  this._videoSettings = videoSettings(this, scope);
  this._videoRequested = shouldRecordAtStart(this._videoSettings, scope);
  this._videoForcedByTag = videoHasTag(scope, '@video');

  const extra = {};
  if (this._videoRequested) {
    require('fs').mkdirSync(this._videoSettings.dir, { recursive: true });
    extra.recordVideo = {
      dir: this._videoSettings.dir,
      size: this._videoSettings.size,
    };
  }

  await this.openBrowser(extra);
  if (this.minWaitTime.before_scenario > 0) {
    await this.page.waitForTimeout(this.minWaitTime.before_scenario);
  }
});

After({ order: 5 }, async function (scope) {
  if (this.minWaitTime.after_scenario > 0) {
    try { await this.page.waitForTimeout(this.minWaitTime.after_scenario); } catch { /* page already closed */ }
  }

  const status = (scope && scope.result && scope.result.status) || 'unknown';
  const videoRef = (this._videoRequested && this.page) ? this.page.video() : null;
  // Capture the raw Playwright path BEFORE closing the context — after
  // close, the remote handle is gone and video.path() throws.
  let rawPath = null;
  if (videoRef) {
    try { rawPath = await videoRef.path(); } catch { /* may throw on remote */ }
  }

  // Close the *context* (flushes the webm to disk). Browser stays up so
  // saveAs() / delete() can still talk to it.
  if (this.context) {
    try { await this.context.close(); } catch { /* ignore */ }
  }

  if (videoRef) {
    const settings = this._videoSettings;
    const filename = this._videoSaveAsName || buildVideoFilename(settings.filenamePattern, scope, status);
    const dest = require('path').join(settings.dir, filename);
    try {
      const passed = status === 'PASSED' || status === 'passed';
      if (settings.mode === 'on-failure' && passed && !this._videoForcedByTag) {
        await videoRef.delete().catch(() => {});
      } else {
        await videoRef.saveAs(dest);
        await videoRef.delete().catch(() => {});
        process.stderr.write(`\n[webship-js] video saved → ${dest}\n`);
      }
    } catch (e) {
      process.stderr.write(`\n[webship-js] video save failed: ${e.message}\n`);
    }
    // Fallback: remove the Playwright scratch file via fs if it still exists.
    if (rawPath) {
      try { require('fs').unlinkSync(rawPath); } catch { /* already gone */ }
    }
  }

  // Finally close the browser.
  if (this.playwrightBrowser) {
    try { await this.playwrightBrowser.close(); } catch { /* ignore */ }
    this.playwrightBrowser = null;
  }
  this.context = null;
  this.page = null;
});

BeforeStep(async function () {
  if (this.page && this.minWaitTime.before_step > 0) {
    await this.page.waitForTimeout(this.minWaitTime.before_step);
  }
});

// BBR: regex matches steps that mutate page state (click/press/fill/check/etc.).
// After such a step, run a short smartSettle so assertions in the next step
// observe the post-action edge instead of mid-transition state.
const STATE_MUTATING_STEP = /\b(click|press|fill|submit|select|check|uncheck|choose|attach|reload|move (?:back|forward)|go to|navigate|on (?:the )?(?:home|front)page)\b/i;

AfterStep(async function (scope) {
  if (!this.page) return;
  if (this.minWaitTime.after_step > 0) {
    await this.page.waitForTimeout(this.minWaitTime.after_step);
  }
  // Auto-settle only after state-changing steps. Skip if disabled via env var.
  if (process.env.WEBSHIP_AUTO_SETTLE === 'off') return;
  const text = scope && scope.pickleStep && scope.pickleStep.text;
  if (typeof text !== 'string') return;
  if (!STATE_MUTATING_STEP.test(text)) return;
  try { await smartSettle(this.page, 1500); } catch { /* best effort */ }
});


// ===========================================================================
// All step definitions previously defined in this file have been split out
// by topic. Cucumber-js auto-loads every *.steps.js in tests/step-definitions/,
// so feature files keep working unchanged.
//
// Topical homes:
//   navigation.steps.js  Given/When/Then for sessions, homepage, paths, history
//   action.steps.js      press, click (text/attr/row), follow, attach file
//   form.steps.js        fill, select, additionally select, check, uncheck, radio
//   assertion.steps.js   should see / not see, in row, in element, response,
//                        text matching, link href, count, status code
//   field.steps.js       field/checkbox/radio state assertions
//   modal.steps.js       modal visibility, content, button click, close
//   wait.steps.js        every BBR wait phrasing
//   scroll.steps.js      page + scoped element scrolling
//   debug.steps.js       print URL / response (debug only)
// ===========================================================================
