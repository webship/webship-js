'use strict';

// Auto-detect JavaScript errors during test execution.
//
// Listeners are attached on Before (order 200) once a page is open:
//   page.on('pageerror')           → uncaught errors
//   page.on('console', level)      → console messages (filtered by config)
//
// After every scenario the collector reports per the active "mode":
//   - 'warn' (default)  → log a yellow warning, scenario still passes
//   - 'fail'            → assert.fail with the error list
//   - 'off'             → silent
//
// Mode resolution priority (first match wins):
//   1. scenario tag       @js-fail / @js-warn / @js-off / @javascript / @js-errors
//   2. env var            WEBSHIP_JS_ERROR_MODE = warn | fail | off
//   3. worldParameters    parameters.javascript.mode
//   4. default            'warn'
//
// Back-compat: @javascript → fail (legacy "always fail" tag). @js-errors → off.

const { Before, After, Then } = require('@cucumber/cucumber');
const assert = require('assert');

const VALID_MODES = new Set(['warn', 'fail', 'off']);
const DEFAULT_CONSOLE_LEVELS = ['error'];

/**
 * Resolve effective settings for the current scenario.
 *
 * @returns {{ mode: 'warn'|'fail'|'off', levels: string[], ignore: RegExp|null,
 *             beforeScenario: boolean, afterScenario: boolean }}
 */
function resolveSettings(world, scope) {
  const cfg = (world.parameters && world.parameters.javascript) || {};
  const tag = (name) => hasTag(scope, name);

  let mode;
  if (tag('@js-fail') || tag('@javascript'))      mode = 'fail';
  else if (tag('@js-warn'))                        mode = 'warn';
  else if (tag('@js-off') || tag('@js-errors'))    mode = 'off';
  else if (process.env.WEBSHIP_JS_ERROR_MODE)      mode = process.env.WEBSHIP_JS_ERROR_MODE;
  else if (cfg.mode)                               mode = cfg.mode;
  else                                             mode = 'warn';
  if (!VALID_MODES.has(mode)) mode = 'warn';

  const levelsRaw =
    process.env.WEBSHIP_JS_ERROR_LEVELS ||
    (Array.isArray(cfg.levels) ? cfg.levels.join(',') : cfg.levels) ||
    DEFAULT_CONSOLE_LEVELS.join(',');
  const levels = String(levelsRaw).split(',').map((s) => s.trim()).filter(Boolean);

  const ignoreSrc = process.env.WEBSHIP_JS_ERROR_IGNORE || cfg.ignore || null;
  let ignore = null;
  if (ignoreSrc) {
    try { ignore = new RegExp(ignoreSrc); }
    catch { ignore = null; }
  }

  const beforeScenario =
    process.env.WEBSHIP_JS_ERROR_BEFORE === '1'
      ? true
      : cfg.beforeScenario === true;
  const afterScenario  =
    process.env.WEBSHIP_JS_ERROR_AFTER === '0'
      ? false
      : cfg.afterScenario !== false;   // default true

  return { mode, levels, ignore, beforeScenario, afterScenario };
}

function hasTag(scope, name) {
  if (!scope || !Array.isArray(scope.pickle && scope.pickle.tags)) return false;
  return scope.pickle.tags.some((t) => t.name === name);
}

function formatErrors(errs) {
  return errs.map((e, i) => `  ${i + 1}. [${e.type}] ${e.message}`).join('\n');
}

function filterErrors(errs, ignore) {
  if (!ignore) return errs;
  return errs.filter((e) => !ignore.test(e.message));
}

function reportWarning(scope, errs) {
  const name = (scope && scope.pickle && scope.pickle.name) || 'scenario';
  // Yellow ANSI when FORCE_COLOR is on, plain otherwise — let the runtime
  // decide. cucumber-js sets FORCE_COLOR=1 by default in interactive shells.
  const head = `[webship-js] JavaScript errors during "${name}" (mode=warn):`;
  process.stderr.write(`\n\x1b[33m${head}\n${formatErrors(errs)}\x1b[0m\n`);
}

// ---------------------------------------------------------------------------
// Before — attach listeners + (optional) pre-snapshot.
// ---------------------------------------------------------------------------

Before({ order: 200 }, function (scope) {
  this._jsErrors = [];
  this._jsErrorsAsserted = false;
  this._jsSettings = resolveSettings(this, scope);
  if (this._jsSettings.mode === 'off') return;
  if (!this.page) return;

  const levels = new Set(this._jsSettings.levels);
  this.page.on('pageerror', (err) => {
    this._jsErrors.push({ type: 'pageerror', message: String(err && err.message || err) });
  });
  this.page.on('console', (msg) => {
    if (levels.has(msg.type())) {
      this._jsErrors.push({ type: `console.${msg.type()}`, message: msg.text() });
    }
  });

  if (this._jsSettings.beforeScenario) {
    // Pre-scenario snapshot — typically empty unless the same page is reused.
    const errs = filterErrors(this._jsErrors, this._jsSettings.ignore);
    if (errs.length > 0) {
      process.stderr.write(
        `\n\x1b[33m[webship-js] Pre-scenario JavaScript errors:\n${formatErrors(errs)}\x1b[0m\n`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/**
 * Assert that no JavaScript errors have been collected so far.
 *
 * Always fails on error (ignoring the active mode) — this is the explicit
 * "hard check" step. Calling it also prevents the auto-report at scenario
 * end so a single error is not reported twice.
 *
 * Example #1: Then there should be no JavaScript errors
 * Example #2: And there should be no JavaScript errors
 * Example #3: But there should be no JavaScript errors
 * Example #4: Then there should be no JavaScript errors
 * Example #5: Then there should be no JavaScript errors
 *
 */
Then(/^there should be no JavaScript errors$/, function () {
  this._jsErrorsAsserted = true;
  const errs = filterErrors(this._jsErrors || [], this._jsSettings && this._jsSettings.ignore);
  if (errs.length === 0) return;
  assert.fail(`JavaScript errors detected:\n${formatErrors(errs)}`);
});

/**
 * Assert that no JavaScript console warnings were collected. Requires
 * 'warning' to be in the captured console levels (see worldParameters or
 * WEBSHIP_JS_ERROR_LEVELS).
 *
 * Example #1: Then there should be no JavaScript warnings
 * Example #2: And there should be no JavaScript warnings
 * Example #3: But there should be no JavaScript warnings
 * Example #4: Then there should be no JavaScript warnings
 * Example #5: Then there should be no JavaScript warnings
 *
 */
Then(/^there should be no JavaScript warnings$/, function () {
  this._jsErrorsAsserted = true;
  const errs = (this._jsErrors || []).filter((e) => e.type === 'console.warning');
  if (errs.length === 0) return;
  assert.fail(`JavaScript warnings detected:\n${formatErrors(errs)}`);
});

/**
 * Assert that no collected JavaScript error message matches a regular
 * expression. Useful when some noise is unavoidable but a specific bug
 * pattern must never appear.
 *
 * Example #1: Then JavaScript errors should not match "TypeError"
 * Example #2: Then JavaScript errors should not match "is not a function"
 * Example #3: And JavaScript errors should not match "Cannot read property"
 * Example #4: Then JavaScript errors should not match "ReferenceError: .* is not defined"
 * Example #5: Then JavaScript errors should not match "Uncaught"
 *
 */
Then(/^JavaScript errors should not match "([^"]*)"$/, function (pattern) {
  let re;
  try { re = new RegExp(pattern); }
  catch (e) {
    assert.fail(`Invalid regular expression: "${pattern}" — ${e.message}`);
  }
  const errs = (this._jsErrors || []).filter((e) => re.test(e.message));
  if (errs.length === 0) return;
  assert.fail(`JavaScript errors matched /${pattern}/:\n${formatErrors(errs)}`);
});

/**
 * Print the JavaScript errors collected so far. Diagnostic only — never
 * asserts, never fails. Useful inside a scenario being debugged.
 *
 * Example #1: Then print JavaScript errors
 * Example #2: And print JavaScript errors
 * Example #3: But print JavaScript errors
 * Example #4: Then print JavaScript errors
 * Example #5: Then print JavaScript errors
 *
 */
Then(/^print JavaScript errors$/, function () {
  const errs = this._jsErrors || [];
  if (errs.length === 0) {
    console.log('\n--- JavaScript errors: none ---');
    return;
  }
  console.log('\n--- JavaScript errors ---');
  console.log(formatErrors(errs));
});

// ---------------------------------------------------------------------------
// After — report per mode.
// ---------------------------------------------------------------------------

After({ order: 200 }, function (scope) {
  const s = this._jsSettings || resolveSettings(this, scope);
  if (s.mode === 'off') return;
  if (!s.afterScenario) return;
  if (this._jsErrorsAsserted) return;            // already handled by explicit step

  const errs = filterErrors(this._jsErrors || [], s.ignore);
  if (errs.length === 0) return;

  if (s.mode === 'fail') {
    assert.fail(`JavaScript errors detected during scenario:\n${formatErrors(errs)}`);
  } else {
    reportWarning(scope, errs);
  }
});
