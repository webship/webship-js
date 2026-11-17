'use strict';

const { setWorldConstructor, World, Before, After, BeforeStep, AfterStep, setDefaultTimeout } = require('@cucumber/cucumber');
const playwright = require('playwright');
const playwrightConfig = require(require('path').join(process.cwd(), 'playwright.config'));
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Output filter — strip noisy `✔ Before # ...` / `✔ After # ...` hook lines
// from cucumber-js's failure dump so tester-facing output stays focused on
// the failing step + hint. In a dry run (--dry-run or -d), also strip the
// pretty formatter's "- skipped" lines: every hook and every step of a dry
// run is skipped, and a line for each buries the "? undefined" and
// "✖ ambiguous" lines the dry run is for. Disable with
// WEBSHIP_FILTER_HOOK_LINES=off.
// ---------------------------------------------------------------------------
if (process.env.WEBSHIP_FILTER_HOOK_LINES !== 'off') {
  const HOOK_LINE = /^\s*[✔✖✗⚠?-]\s+(?:Before|After|BeforeStep|AfterStep)\b.*$/;
  const DRY_RUN = process.argv.slice(2).some((arg) => arg === '--dry-run' || arg === '-d');
  const SKIPPED_LINE = /^\s*-\s+skipped\s*$/;
  const plain = (line) => line.replace(/\x1b\[[0-9;]*m/g, '');
  const dropped = (line) => HOOK_LINE.test(plain(line)) || (DRY_RUN && SKIPPED_LINE.test(plain(line)));
  const wrap = (stream) => {
    const orig = stream.write.bind(stream);
    // The pretty formatter writes a line and its line break in two writes:
    // when a line is dropped, so is the line break that follows it.
    let dropLineBreak = false;
    stream.write = (chunk, encoding, cb) => {
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        const skipBreak = dropLineBreak && /^\r?\n$/.test(text);
        dropLineBreak = false;
        if (skipBreak || (!text.includes('\n') && text.trim() && dropped(text))) {
          dropLineBreak = !skipBreak;
          const done = typeof encoding === 'function' ? encoding : cb;
          if (typeof done === 'function') process.nextTick(done);
          return true;
        }
        const filtered = text
          .split('\n')
          .filter((line) => !dropped(line))
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
// Steps 4/5/6 are evaluated atomically in one page-side probe, so a
// late-firing setTimeout that mutates the DOM re-arms the wait correctly.
// The probe is polled from Node (see pollPage), never from a timer inside the
// page: a poll that runs on the page's own setTimeout is counted by step 5 as
// a pending timer, so the probe would see itself and never pass.
// ---------------------------------------------------------------------------

/**
 * Smallest timeout worth handing to Playwright. Playwright reads `timeout: 0`
 * as "no timeout at all", so a spent budget must never reach it as a zero —
 * that is how a settle could wait forever instead of giving up.
 *
 * @type {number}
 */
const SETTLE_MIN_MS = 25;

/**
 * Poll a page-side probe from Node until it returns a truthy value or the
 * budget is spent.
 *
 * Use this instead of `page.waitForFunction(..., { polling: <ms> })` for any
 * probe that reads `window.__webshipPendingTimers`. Interval polling inside
 * the page runs on the page's `setTimeout`, which the init script wraps to
 * count pending timers, so such a probe counts its own next poll: it can only
 * pass on its very first look, and waits out its whole timeout otherwise.
 *
 * A probe that throws (the page is navigating, the context was replaced) is
 * read as "not yet" and looked at again.
 *
 * @param {import('playwright').Page} page   - Page being probed.
 * @param {Function} probe                   - Runs in the page; truthy means done.
 * @param {*} arg                            - Single argument handed to the probe.
 * @param {number} timeout                   - Budget in ms.
 * @param {number} [interval=50]             - Pause between two looks, in ms.
 * @returns {Promise<boolean>} true when the probe passed inside the budget.
 */
async function pollPage(page, probe, arg, timeout, interval) {
  const pause = typeof interval === 'number' && interval > 0 ? interval : 50;
  const deadline = Date.now() + (typeof timeout === 'number' && timeout > 0 ? timeout : 0);
  for (;;) {
    let done = false;
    try { done = await page.evaluate(probe, arg); } catch { /* not ready yet */ }
    if (done) return true;
    if (Date.now() + pause >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, pause));
  }
}

/**
 * Wait for the page to reach an "edge" of activity — DOM ready, network
 * idle, no pending AJAX or timers, and no DOM mutations for ≥250 ms.
 *
 * Each stage but the last gets a share of the budget rather than "whatever
 * is left", so a stage that can never resolve cannot starve the ones after
 * it. On a page with analytics, a chat widget or a self-rescheduling timer,
 * `networkidle` never arrives; capping it at half the budget keeps the AJAX /
 * pending-timer / DOM-quiet probe — the useful one — running. That probe is
 * the last stage, with nothing after it to starve: it gets everything the
 * earlier stages left, so a request or a timer of more than half the budget
 * is still waited for.
 *
 * Returns within `timeout` ms even when nothing on the page ever settles.
 *
 * @param {import('playwright').Page} page    - Page being probed.
 * @param {number} [timeout=10000]            - Total budget in ms.
 * @returns {Promise<void>}
 */
async function smartSettle(page, timeout) {
  const total = typeof timeout === 'number' && timeout > 0 ? timeout : 10000;
  const deadline = Date.now() + total;

  // Milliseconds left in the budget. Never handed to Playwright directly: a
  // zero there means "no timeout", not "return immediately".
  const left = () => deadline - Date.now();

  // Run one stage with at most `share` of the original budget, and never more
  // than what is actually left. Returns false once the budget is spent, so the
  // caller stops instead of calling Playwright with a useless timeout.
  const stage = async (share, fn) => {
    const remaining = left();
    if (remaining < SETTLE_MIN_MS) return false;
    const budget = Math.max(SETTLE_MIN_MS, Math.min(remaining, Math.round(total * share)));
    try { await fn(budget); } catch { /* a stage timing out is not a failure */ }
    return left() >= SETTLE_MIN_MS;
  };

  if (!await stage(0.25, (t) => page.waitForSelector('body', { state: 'attached', timeout: t }))) return;
  if (!await stage(0.25, (t) => page.waitForLoadState('domcontentloaded', { timeout: t }))) return;
  if (!await stage(0.5, (t) => page.waitForLoadState('networkidle', { timeout: t }))) return;
  await stage(1, (t) => pollPage(
    page,
    (quietMs) => {
      const ajax = window.__webshipAjaxCount;
      const timers = window.__webshipPendingTimers;
      const last = window.__webshipLastMutation;
      const now = typeof window.__webshipNow === 'function' ? window.__webshipNow() : Date.now();
      // Under a fake clock the page's timers are the clock's and run only
      // when it moves; the ones the probes count are the clock's own.
      const fakeClock = !!(window.Date && window.Date.isFake);
      if (typeof ajax === 'number' && ajax > 0) return false;
      if (!fakeClock && typeof timers === 'number' && timers > 0) return false;
      if (typeof last === 'number' && now - last < quietMs) return false;
      return true;
    },
    250,
    t
  ));
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
 * Resolve the value a step was given into the URL to request: an absolute
 * `http://` or `https://` URL is returned as written, anything else is a
 * path and is appended to the launch URL.
 *
 * @param {string} launchUrl
 * @param {string} url
 * @returns {string}
 */
function resolveUrl(launchUrl, url) {
  const value = url === undefined || url === null ? '' : String(url);
  if (/^https?:\/\//i.test(value)) return value;
  return (launchUrl || '') + value;
}

// Transport settings of the browser context that a request sent outside the
// browser session still has to follow: the HTTPS setting, the proxy and the
// client certificates. Nothing of the session itself (cookies, storage,
// credentials, extra headers) is in this list.
function transportOptions() {
  const from = playwrightConfig.contextOptions || {};
  const options = {};
  for (const key of ['ignoreHTTPSErrors', 'proxy', 'clientCertificates']) {
    if (from[key] !== undefined) options[key] = from[key];
  }
  return options;
}

function hasHeader(headers, name) {
  const wanted = name.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === wanted);
}

/**
 * Send an HTTP request with Playwright's request API and return the answer
 * as `{ status, statusText, headers, data, config }`: header names are in
 * lower case and `data` is the parsed JSON when the body is JSON, the body
 * text otherwise. No status code throws.
 *
 * `session: true` sends the request through the browser context, so it
 * shares the cookies, the credentials and the extra headers of the page.
 * `session: false` sends it from a request context of its own: no cookie of
 * the browser goes with it and none comes back into the browser. Both follow
 * the HTTPS setting of the browser context, so a self-signed or locally
 * issued certificate is accepted whenever the browser accepts it.
 *
 * @param {Object} world
 * @param {{method: string, url: string, headers?: Object, data?: *, session?: boolean}} request
 * @returns {Promise<{status: number, statusText: string, headers: Object, data: *, config: Object}>}
 */
async function sendRequest(world, { method, url, headers, data, session }) {
  const verb = String(method || 'GET').toUpperCase();
  const sent = Object.assign({}, headers || {});
  if (!hasHeader(sent, 'accept')) sent.Accept = 'application/json, text/plain, */*';
  const options = { method: verb, headers: sent, failOnStatusCode: false };
  if (data !== undefined && data !== null) {
    options.data = data;
    // A raw text body with no declared type goes out as a form body.
    if (typeof data === 'string' && !hasHeader(sent, 'content-type') && /^(POST|PUT|PATCH)$/.test(verb)) {
      sent['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  }
  const shared = session && world && world.context ? world.context.request : null;
  const own = shared ? null : await playwright.request.newContext(transportOptions());
  try {
    const response = await (shared || own).fetch(url, options);
    const text = await response.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) { /* not JSON: keep the text */ }
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      data: body,
      config: { method: verb.toLowerCase(), url },
    };
  } finally {
    if (own) await own.dispose();
  }
}

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
 * @param {string} value - Value to type; null or undefined fills an empty value.
 * @returns {Promise<void>}
 */
async function fillField(page, field, value) {
  // An empty value in a step ("") reaches the definition as null: it means "".
  value = value === undefined || value === null ? '' : String(value);
  const byLabel = page.getByLabel(field, { exact: true });
  if (await byLabel.count() > 0) {
    await fillLocator(page, byLabel, value, field);
    return;
  }
  const byPlaceholder = page.getByPlaceholder(field, { exact: true });
  if (await byPlaceholder.count() > 0) {
    await fillLocator(page, byPlaceholder, value, field);
    return;
  }
  const byName = page.locator(`[name="${field}"]`).first();
  if (await byName.count() > 0) {
    await fillLocator(page, byName, value, field);
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
 * Fill the field a step found. A field that is hidden, disabled or read-only,
 * or that is not on the page, fails the step within 5 seconds with what is
 * wrong with it, the page and a hint, instead of Playwright's raw timeout.
 *
 * @param {import('playwright').Page} page
 * @param {import('playwright').Locator} loc - The field.
 * @param {string} value - Value to type; null or undefined fills an empty value.
 * @param {string} name - How the step named the field, for the message.
 * @returns {Promise<void>}
 */
async function fillLocator(page, loc, value, name) {
  const text = value === undefined || value === null ? '' : String(value);
  try {
    await loc.fill(text, { timeout: 5000 });
    return;
  } catch (e) {
    let state = '';
    try {
      if (await loc.count() === 0) state = 'missing';
      else if (!(await loc.first().isVisible())) state = 'hidden';
      else if (await loc.first().isDisabled({ timeout: 1000 })) state = 'disabled';
      else if (!(await loc.first().isEditable({ timeout: 1000 }))) state = 'read-only';
    } catch { /* the page changed while it was looked at */ }
    if (state === 'missing') {
      throw failure(page, `No field with "${name}" was found after 5 seconds.`, {
        hint: 'by attribute the step reads the text as the attribute it names, else as an id, a class, a name, a test id, an aria-label, a value, a placeholder or a title; a text that starts with #, . or [ is a CSS selector.',
      });
    }
    if (state === 'hidden') {
      throw failure(page, `The field "${name}" is on the page but hidden, so it cannot be filled.`, {
        hint: 'a field that shows after an action can be filled once it is visible: wait for it first. A field hidden behind a rich-text editor is filled with: I fill in the WYSIWYG field "<name>" with the "<text>"',
      });
    }
    if (state === 'disabled' || state === 'read-only') {
      throw failure(page, `The field "${name}" is ${state}, so it cannot be filled.`, {
        hint: `a ${state} field keeps its value; to check it, use: the field "${name}" should have "${state}" state`,
      });
    }
    throw failure(page, `Could not fill the field "${name}".`, { hint: `${humanize(e)}.` });
  }
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
 * Find the element a step names either by the text of its label or by a CSS
 * selector: the field of the label with that exact text and a `for`
 * attribute when the page has one, else the first element the selector
 * matches. Both are looked for together, so a selector does not wait for a
 * label that will never come.
 *
 * @param {import('playwright').Page} page - Page being probed.
 * @param {string} name                    - Label text or CSS selector.
 * @param {number} [timeout=5000]          - How long to look, in ms.
 * @returns {Promise<import('playwright').Locator|null>} The element, or null when neither was found in time.
 */
async function locateByLabelOrSelector(page, name, timeout) {
  const deadline = Date.now() + (typeof timeout === 'number' && timeout > 0 ? timeout : 5000);
  const labels = page.getByText(name, { exact: true });
  for (;;) {
    const forIds = await labels.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('for'))).catch(() => []);
    const forId = forIds.find((id) => id);
    if (forId) return page.locator(`[id="${forId.replace(/["\\]/g, '\\$&')}"]`).first();
    // A label text is rarely a valid selector: an invalid one matches nothing.
    const bySelector = await page.locator(name).count().catch(() => 0);
    if (bySelector > 0) return page.locator(name).first();
    if (Date.now() >= deadline) return null;
    await page.waitForTimeout(100);
  }
}

// The package's own tests/assets/: read last, so that a file only the package
// ships keeps working.
const PACKAGE_ASSETS = path.join(__dirname, '..', 'assets');

/**
 * Find a file a step names by its name: an absolute path as written; a
 * relative one in the World's `assetsFolder` (the project's tests/assets/),
 * then as written from the project root, then in the package's own
 * tests/assets/. Fails plainly, with the paths tried, when none holds it.
 *
 * @param {WebshipWorld} world
 * @param {string} name - The file as the step gives it.
 * @returns {string} The absolute path of the file.
 */
function resolveAssetFile(world, name) {
  const fs = require('fs');
  const file = String(name === undefined || name === null ? '' : name).trim();
  const tried = path.isAbsolute(file)
    ? [file]
    : [...new Set([
      path.resolve((world && world.assetsFolder) || path.join(process.cwd(), 'tests', 'assets'), file),
      path.resolve(process.cwd(), file),
      path.resolve(PACKAGE_ASSETS, file),
    ])];
  const found = tried.find((candidate) => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  });
  if (found) return found;
  throw failure(world && world.page, `The file "${file}" was not found.`, {
    found: `nothing at ${tried.map((candidate) => path.relative(process.cwd(), candidate) || candidate).join(', ')}`,
    hint: 'put the file in the tests/assets/ folder of the project, or name it by its path from the project root.',
  });
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

/**
 * Shorten a text for a failure message: white space collapsed, cut at
 * `max` characters.
 *
 * @param {string} text
 * @param {number} [max=200]
 * @returns {string}
 */
function excerpt(text, max) {
  const limit = typeof max === 'number' && max > 0 ? max : 200;
  const clean = String(text === null || text === undefined ? '' : text).replace(/\s+/g, ' ').trim();
  return clean.length > limit ? clean.slice(0, limit) + '…' : clean;
}

/**
 * Locator for the page when its text contains `text`, read the way the page
 * text steps (`I should see`, `I should not see`, `eventually I should see`)
 * read it: Playwright's text matching on `<body>`, letter case ignored, white
 * space collapsed, the text of hidden elements included, the text of
 * `<script>`, `<noscript>` and `<style>` left out. It matches nothing while
 * the text is not on the page, so `waitFor({ state: 'attached' })` waits for
 * the text to come and `waitFor({ state: 'detached' })` for it to go.
 *
 * @param {import('playwright').Page} page
 * @param {string} text
 * @returns {import('playwright').Locator}
 */
function pageTextLocator(page, text) {
  return page.locator('body').filter({ hasText: text === undefined || text === null ? '' : String(text) });
}

/**
 * True when an error is Playwright giving up after its timeout, which in an
 * assertion means "what was looked for is not there".
 *
 * @param {Error} error
 * @returns {boolean}
 */
function isTimeout(error) {
  return !!error && (error.name === 'TimeoutError' || /Timeout \d+ms exceeded/.test(String(error.message || '')));
}

/**
 * Build the failure of an assertion for a tester: what was looked for, what
 * was found, the address of the page and a hint. No call log, no stack.
 *
 * @param {import('playwright').Page} page - Page the assertion ran on.
 * @param {string} message                 - What was expected and did not hold.
 * @param {Object} [details]
 * @param {string} [details.found]         - What was there instead.
 * @param {string} [details.hint]          - What to check or try next.
 * @returns {Error}
 */
function failure(page, message, details) {
  const lines = [message];
  const info = details || {};
  if (info.found !== undefined && info.found !== null) lines.push(`  Found: ${info.found}`);
  let url = '';
  try { url = page.url(); } catch { /* the page is gone */ }
  if (url) lines.push(`  Page: ${url}`);
  if (info.hint) lines.push(`  Hint: ${info.hint}`);
  return friendly(lines.join('\n'));
}

module.exports = {
  smartSettle,
  pollPage,
  waitForPageLoad,
  getModalSelector,
  getModalLocator,
  waitForModalState,
  findVisibleModal,
  isAnyModalVisible,
  buildSelector,
  gotoUrl,
  resolveUrl,
  sendRequest,
  fillField,
  fillLocator,
  getLocatorText,
  locateByLabelOrSelector,
  resolveAssetFile,
  pad,
  resolveRelativeDate,
  parseRelativeOffset,
  formatRelativeDate,
  friendly,
  humanize,
  failure,
  excerpt,
  isTimeout,
  pageTextLocator,
  breakpoints,
  breakpoint,
  onNewPage,
  videoFileName,
};

// ---------------------------------------------------------------------------
// Auto HTML report on cucumber-js process exit.
// Disable: WEBSHIP_REPORT_DISABLE=1. Extra flags: WEBSHIP_REPORT_ARGS="--theme hierarchy --layout 2".
// Registered once per process, and run only in the process that runs
// cucumber-js: the workers of a --parallel run load these files too, but exit
// before the JSON report is complete.
// ---------------------------------------------------------------------------

/**
 * The values given to an option on a command line, in order: `--name value`,
 * `--name=value` and the short form `-n value`.
 *
 * @param {string[]} args
 * @param {string} name   - Long name, with its dashes (`--format`).
 * @param {string} [short] - Short name, with its dash (`-f`).
 * @returns {string[]}
 */
function optionValues(args, name, short) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name || (short && args[i] === short)) {
      if (i + 1 < args.length) values.push(args[i + 1]);
      i += 1;
    } else if (args[i].startsWith(name + '=')) {
      values.push(args[i].slice(name.length + 1));
    }
  }
  return values;
}

/**
 * The file of the last `json` formatter in a list of cucumber-js formats
 * (`json:path`, `"json":"path"` or `['json', 'path']`), or '' when there is
 * none that writes to a file.
 *
 * @param {Array<string|string[]>} formats
 * @returns {string}
 */
function jsonFormatterFile(formats) {
  let file = '';
  for (const format of formats || []) {
    if (Array.isArray(format)) {
      if (format[0] === 'json' && format[1]) file = String(format[1]);
      continue;
    }
    const match = /^"?json"?:(.+)$/.exec(String(format));
    if (match) file = match[1].replace(/^"(.*)"$/, '$1');
  }
  return file;
}

/**
 * The formats of the cucumber-js config file of this run, for the profiles
 * the command line names, else the default one. A config file that cannot be
 * read here (an ES module, a YAML file) gives none.
 *
 * @param {string[]} args - The command line of cucumber-js.
 * @returns {Array<string|string[]>}
 */
function configFormats(args) {
  const named = optionValues(args, '--config', '-c');
  const candidates = named.length
    ? [named[named.length - 1]]
    : ['cucumber.js', 'cucumber.cjs', 'cucumber.json'];
  for (const candidate of candidates) {
    const file = path.resolve(process.cwd(), candidate);
    if (!/\.(c?js|json)$/.test(file) || !require('fs').existsSync(file)) continue;
    try {
      const loaded = require(file);
      const profiles = optionValues(args, '--profile', '-p');
      const formats = [];
      for (const profile of profiles.length ? profiles : ['default']) {
        const config = (loaded && loaded[profile]) || (profile === 'default' && loaded && !loaded.default ? loaded : null);
        if (config && Array.isArray(config.format)) formats.push(...config.format);
      }
      return formats;
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Where this run wrote its JSON report: WEBSHIP_REPORT_JSON, else the file of
 * the `json` formatter of the command line, else the one of the config file,
 * else the scaffold's `tests/reports/cucumber_report.json`.
 *
 * @returns {string}
 */
function reportJsonFile() {
  if (process.env.WEBSHIP_REPORT_JSON) return process.env.WEBSHIP_REPORT_JSON;
  const args = process.argv.slice(2);
  return jsonFormatterFile(optionValues(args, '--format', '-f'))
    || jsonFormatterFile(configFormats(args))
    || 'tests/reports/cucumber_report.json';
}

if (!global.__WEBSHIP_AUTO_REPORT__) {
  global.__WEBSHIP_AUTO_REPORT__ = true;
  process.on('exit', () => {
    if (process.env.WEBSHIP_REPORT_DISABLE) return;
    // A worker of a --parallel run: the process that runs cucumber-js builds
    // the report once the whole JSON report is written.
    if (process.env.CUCUMBER_WORKER_ID) return;
    try {
      const json = reportJsonFile();
      let size = 0;
      try { size = require('fs').statSync(path.resolve(process.cwd(), json)).size; } catch { /* not written */ }
      if (!size) {
        console.error(`[webship-js] No HTML report: this run wrote no JSON report at "${json}". Set WEBSHIP_REPORT_JSON to the file of your json formatter, or WEBSHIP_REPORT_DISABLE=1 to build no report.`);
        return;
      }
      const { run } = require(path.join(__dirname, '..', '..', 'bin', 'generate-reports'));
      const extra = (process.env.WEBSHIP_REPORT_ARGS || '').split(/\s+/).filter(Boolean);
      Promise.resolve(run(['--json', json].concat(extra))).catch((err) => {
        console.error('[webship-js] Report generation failed:', err.message);
      });
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
//
// setDefaultTimeout() runs at load time and overrides whatever `timeout` a
// consumer set in their own cucumber.js, so WEBSHIP_STEP_TIMEOUT is the
// way to raise (or lower) it from outside. 45s stays the default.
const STEP_TIMEOUT = (() => {
  const raw = parseInt(process.env.WEBSHIP_STEP_TIMEOUT, 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 45 * 1000;
})();
setDefaultTimeout(STEP_TIMEOUT);

// The pacing of worldParameters.minWaitTime, in ms. A project may leave the
// block out or set only some of its keys: the others keep these values.
const MIN_WAIT_TIME = Object.freeze({
  page: 3000,
  before_scenario: 0,
  after_scenario: 0,
  before_step: 0,
  after_step: 0,
});

// BBR: the init script installed on every browser context the World opens.
// It runs before any document script and counts in-flight fetch / XHR
// requests and pending timers and stamps the last DOM mutation, so
// smartSettle() detects the edge of background activity rather than guessing
// a fixed delay.
function smartWaitProbes() {
  if (window.__webshipAjaxInstalled) return;
  window.__webshipAjaxInstalled = true;
  // The time of the probes is real time: a fake clock (Playwright's
  // page.clock) replaces Date later, and its Date.now() may stand still or
  // lie in the past.
  const realNow = Date.now.bind(Date);
  window.__webshipNow = realNow;
  window.__webshipAjaxCount = 0;
  window.__webshipPendingTimers = 0;
  window.__webshipLastMutation = realNow();

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
      new MutationObserver(() => { window.__webshipLastMutation = realNow(); })
        .observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      return true;
    } catch (e) { return false; }
  };
  if (!startObserver()) {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  }
}

// Functions that set up every page the World opens: the first page of a
// scenario and each page a step opens in a new browser context (restoring an
// auth state, starting or stopping a video recording). Step files add theirs
// with onNewPage().
const NEW_PAGE_SETUPS = [];

/**
 * Run `setup(world, page)` on every page the World opens from now on, before
 * any step uses it: the first page of each scenario and every page of a
 * browser context that a step replaces.
 *
 * @param {function(WebshipWorld, import('playwright').Page): (void|Promise<void>)} setup
 * @returns {void}
 */
function onNewPage(setup) {
  if (typeof setup === 'function') NEW_PAGE_SETUPS.push(setup);
}

class PlaywrightWorld extends World {
  constructor(options) {
    super(options);
    this.launchUrl = this.parameters.launchUrl;
    this.minWaitTime = Object.assign({}, MIN_WAIT_TIME, this.parameters.minWaitTime || {});
    this.playwrightBrowser = null;
    this.context = null;
    this.page = null;
    this.assetsFolder = path.join(process.cwd(), 'tests', 'assets');
  }

  async openBrowser(extraContextOptions) {
    const { browser: browserName, launchOptions } = playwrightConfig;
    this.playwrightBrowser = await playwright[browserName].launch(launchOptions);
    await this.openContext(extraContextOptions);
  }

  /**
   * Open a browser context and its page with everything a scenario relies
   * on: the context options of playwright.config.ts, the scenario's own (the
   * viewport of an @mobile / @desktop tag, video recording while it is on),
   * then `extraContextOptions`; the smart-wait init script; and the page
   * setups registered with onNewPage() (JavaScript-error capture, the
   * response tracker, the request log, a pending dialog handler).
   *
   * @param {import('playwright').BrowserContextOptions} [extraContextOptions]
   * @returns {Promise<void>}
   */
  async openContext(extraContextOptions) {
    const options = Object.assign({}, playwrightConfig.contextOptions, this._scenarioContextOptions || {});
    if (this._videoRequested && this._videoSettings) {
      fs.mkdirSync(this._videoSettings.dir, { recursive: true });
      options.recordVideo = { dir: this._videoSettings.dir, size: this._videoSettings.size };
    }
    Object.assign(options, extraContextOptions || {});
    this.context = await this.playwrightBrowser.newContext(options);
    await this.context.addInitScript(smartWaitProbes);
    this.page = await this.context.newPage();
    this.frame = null;
    for (const setup of NEW_PAGE_SETUPS) await setup(this, this.page);
  }

  /**
   * Replace the browser context in the middle of a scenario (restoring an
   * auth state, starting a video recording) with one opened by
   * openContext(), so the new page keeps the smart waits, the viewport of the
   * scenario, video recording and every page setup. The cookies and the
   * local storage of the context go over to the new one, unless
   * `extraContextOptions.storageState` gives others. The new page is blank,
   * and a video of the context being replaced is not kept.
   *
   * @param {import('playwright').BrowserContextOptions} [extraContextOptions]
   * @returns {Promise<void>}
   */
  async replaceContext(extraContextOptions) {
    const extra = Object.assign({}, extraContextOptions || {});
    const outgoing = this.context;
    const video = this.page && typeof this.page.video === 'function' ? this.page.video() : null;
    if (outgoing && !('storageState' in extra)) {
      try { extra.storageState = await outgoing.storageState(); } catch { /* a closed context has nothing to carry */ }
    }
    if (outgoing) {
      try { await outgoing.close(); } catch { /* already closed */ }
    }
    if (video) await video.delete().catch(() => {});
    await this.openContext(extra);
  }

  /**
   * Wait for the page to settle the way the built-in action steps do: no
   * request in flight, no pending timer and a DOM quiet for 250 ms, bounded
   * by `budget` ms (by default 1500, the budget after a step). For a
   * project's own step that changes the page:
   *
   *   When('I add {string} to the cart', async function (item) {
   *     await this.page.click(`[data-add="${item}"]`);
   *     await this.smartSettle();
   *   });
   *
   * @param {number} [budget=1500]
   * @returns {Promise<void>}
   */
  async smartSettle(budget) {
    if (!this.page) return;
    await smartSettle(this.page, typeof budget === 'number' && budget > 0 ? budget : 1500);
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

// A project extends the World instead of replacing it, so the smart waits,
// the viewport tags, video recording and the page setups stay:
//   const { PlaywrightWorld } = require('webship-js/tests/step-definitions/webship');
//   setWorldConstructor(class extends PlaywrightWorld { … });
module.exports.PlaywrightWorld = PlaywrightWorld;

let foreignWorldReported = false;

// A World set with setWorldConstructor that does not extend PlaywrightWorld
// has none of what webship-js puts on a page: say so once, plainly.
function checkWorld(world) {
  if (world instanceof PlaywrightWorld) return;
  // The hooks below read the pacing of the World: give a World of its own
  // the defaults, so it can still run.
  if (!world.minWaitTime) world.minWaitTime = Object.assign({}, MIN_WAIT_TIME);
  if (typeof world.openBrowser !== 'function') {
    throw friendly(
      'The World of this run is not a PlaywrightWorld of webship-js, and it has no openBrowser().\n' +
      "  Hint: extend it instead of replacing it: const { PlaywrightWorld } = require('webship-js/tests/step-definitions/webship'); setWorldConstructor(class extends PlaywrightWorld { … });"
    );
  }
  if (foreignWorldReported) return;
  foreignWorldReported = true;
  process.stderr.write(
    '\n[webship-js] The World of this run does not extend PlaywrightWorld: the smart waits, the @mobile / @desktop viewport, video recording and the page setups depend on it. ' +
    "Extend it instead: const { PlaywrightWorld } = require('webship-js/tests/step-definitions/webship').\n"
  );
}

// ---------------------------------------------------------------------------
// Video recording — Playwright records at browser-context creation. The
// helpers below resolve config + tags into either an empty {} (no
// recording) or { recordVideo: { dir, size } } that gets merged into the
// context options.
// ---------------------------------------------------------------------------

const VIDEO_MODES = new Set(['off', 'on', 'on-failure', 'tag']);

// WEBSHIP_VIDEO_SIZE: "<width>x<height>", such as "1280x720".
function videoSizeFromEnv() {
  const m = String(process.env.WEBSHIP_VIDEO_SIZE || '').trim().match(/^(\d+)\s*[x×]\s*(\d+)$/i);
  return m && parseInt(m[1], 10) > 0 && parseInt(m[2], 10) > 0
    ? { width: parseInt(m[1], 10), height: parseInt(m[2], 10) }
    : null;
}

function videoSettings(world, scope) {
  const cfg = (world.parameters && world.parameters.video) || {};
  let mode = process.env.WEBSHIP_VIDEO || cfg.mode || 'off';
  if (!VIDEO_MODES.has(mode)) mode = 'off';
  return {
    mode,
    dir: process.env.WEBSHIP_VIDEO_DIR || cfg.dir || './videos',
    size: videoSizeFromEnv() || cfg.size || { width: 1280, height: 720 },
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

// The file name of a scenario's video: {datetime} is when the recording
// started, {status} the scenario's result in lower case (passed, failed, …),
// or the word given for a recording a step stopped. A null status leaves
// "<status>" in the name, for a name printed before the scenario ends.
function buildVideoFilename(template, scope, status, startedAt) {
  const featurePath = (scope && scope.gherkinDocument && scope.gherkinDocument.uri) || 'unknown';
  const feature = (scope && scope.gherkinDocument && scope.gherkinDocument.feature && scope.gherkinDocument.feature.name) || 'feature';
  const scenario = (scope && scope.pickle && scope.pickle.name) || 'scenario';
  const featureFile = featurePath.split('/').pop().replace(/\.feature$/, '');
  const dt = (startedAt instanceof Date ? startedAt : new Date()).toISOString().replace(/[:.]/g, '-');
  return template
    .replace('{datetime}', dt)
    .replace('{feature_file}', sanitisePart(featureFile))
    .replace('{feature}', sanitisePart(feature))
    .replace('{scenario}', sanitisePart(scenario))
    .replace('{status}', status === null ? '<status>' : sanitisePart(String(status).toLowerCase()))
    .replace('{ext}', 'webm');
}

/**
 * The file name the current video of the scenario is saved under: the name a
 * step reserved ("I save the current video as"), else the filenamePattern of
 * worldParameters.video with the given status (null: "<status>").
 *
 * @param {WebshipWorld} world
 * @param {?string} status
 * @returns {string}
 */
function videoFileName(world, status) {
  if (world._videoSaveAsName) return world._videoSaveAsName;
  const settings = world._videoSettings || videoSettings(world);
  return buildVideoFilename(settings.filenamePattern, world._scenarioScope, status, world._videoStartedAt);
}

// ---------------------------------------------------------------------------
// Breakpoints: one registry of named viewport sizes for every step and tag
// that names a size — the @mobile and @desktop tags, "I set the viewport to
// the "…" breakpoint" and "I am viewing the site on a … screen".
//
// The built-in names come first, then worldParameters.selectors.breakpoints,
// then the JSON object of WEBSHIP_SELECTORS_BREAKPOINTS, then the names a
// scenario adds with "the following responsive breakpoints:"; each replaces
// the sizes of the names it gives and keeps the others. `desktop` stands for
// the breakpoint marked `default: true` when the project gives no `desktop`
// of its own.
// ---------------------------------------------------------------------------

const BUILT_IN_BREAKPOINTS = Object.freeze({
  xs: { width: 375, height: 667 },
  sm: { width: 576, height: 800 },
  md: { width: 768, height: 1024 },
  lg: { width: 992, height: 768 },
  xl: { width: 1200, height: 900 },
  xxl: { width: 1400, height: 900 },
  xxxl: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 900 },
});

let badBreakpointsReported = false;

/**
 * The named sizes of WEBSHIP_SELECTORS_BREAKPOINTS, or an empty object when
 * it is not set. A value that is not a JSON object of sizes is reported once
 * and ignored.
 *
 * @returns {Object<string, {width: number, height: number}>}
 */
function breakpointsFromEnv() {
  const raw = process.env.WEBSHIP_SELECTORS_BREAKPOINTS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch { /* reported below */ }
  if (!badBreakpointsReported) {
    badBreakpointsReported = true;
    process.stderr.write('\n[webship-js] WEBSHIP_SELECTORS_BREAKPOINTS is not a JSON object of named sizes, such as {"tablet":{"width":800,"height":1280}}; it is ignored.\n');
  }
  return {};
}

/**
 * A `{ width, height }` of whole positive pixels, or null.
 *
 * @param {*} size
 * @returns {{width: number, height: number}|null}
 */
function breakpointSize(size) {
  const width = parseInt(size && size.width, 10);
  const height = parseInt(size && size.height, 10);
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Every named viewport size the scenario can use, in the order of precedence
 * described above.
 *
 * @param {WebshipWorld} world
 * @returns {Object<string, {width: number, height: number}>}
 */
function breakpoints(world) {
  const configured = (world && world.parameters && world.parameters.selectors && world.parameters.selectors.breakpoints) || {};
  const fromEnv = breakpointsFromEnv();
  const named = Object.assign({}, BUILT_IN_BREAKPOINTS);
  for (const source of [configured, fromEnv]) {
    for (const [name, value] of Object.entries(source)) {
      const size = breakpointSize(value);
      if (size) named[name] = size;
    }
  }
  if (!('desktop' in configured) && !('desktop' in fromEnv)) {
    const marked = Object.values(Object.assign({}, configured, fromEnv)).find((value) => value && value.default === true);
    const size = breakpointSize(marked);
    if (size) named.desktop = size;
  }
  return Object.assign(named, (world && world.__scenarioBreakpoints) || {});
}

/**
 * The size of a named breakpoint. Throws a tester-facing error that lists the
 * known names when there is no such breakpoint.
 *
 * @param {WebshipWorld} world
 * @param {string} name
 * @returns {{width: number, height: number}}
 */
function breakpoint(world, name) {
  const named = breakpoints(world);
  const key = String(name === undefined || name === null ? '' : name).trim();
  if (Object.prototype.hasOwnProperty.call(named, key)) return Object.assign({}, named[key]);
  throw failure(world && world.page, `There is no breakpoint named "${key}".`, {
    found: `the breakpoints ${Object.keys(named).join(', ')}`,
    hint: 'name a size in worldParameters.selectors.breakpoints of cucumber.js, in WEBSHIP_SELECTORS_BREAKPOINTS (a JSON object), or for one scenario with "Given the following responsive breakpoints:".',
  });
}

// A scenario tagged @mobile or @desktop opens at the size of the `mobile` or
// the `desktop` breakpoint. Without either tag the viewport stays fluid
// (contextOptions.viewport). A step can still change the viewport inside the
// scenario.
const TAG_BREAKPOINTS = [['@mobile', 'mobile'], ['@desktop', 'desktop']];

function tagViewport(world, scope) {
  const tags = new Set(((scope && scope.pickle && scope.pickle.tags) || []).map((t) => t.name));
  const entry = TAG_BREAKPOINTS.find(([tag]) => tags.has(tag));
  return entry ? breakpoint(world, entry[1]) : null;
}

Before({ order: 5 }, async function (scope) {
  checkWorld(this);
  this._scenarioScope = scope;
  this._videoSettings = videoSettings(this, scope);
  this._videoRequested = shouldRecordAtStart(this._videoSettings, scope);
  this._videoForcedByTag = videoHasTag(scope, '@video');
  this._videoStartedAt = this._videoRequested ? new Date() : null;

  // Kept for the whole scenario: a step that replaces the browser context
  // opens the new one with the same viewport (see openContext).
  const viewport = tagViewport(this, scope);
  this._scenarioContextOptions = viewport ? { viewport } : {};

  await this.openBrowser();
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
    const filename = videoFileName(this, status);
    const dest = require('path').join(settings.dir, filename);
    try {
      const passed = status === 'PASSED' || status === 'passed';
      // on-failure keeps a passing scenario's video only when the @video tag
      // or "I save the current video as" asked for it.
      if (settings.mode === 'on-failure' && passed && !this._videoForcedByTag && !this._videoSaveAsName) {
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
