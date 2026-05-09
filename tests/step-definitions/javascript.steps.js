'use strict';

// Auto-detect JavaScript errors during test execution.
//
// Errors collected from page.on('pageerror') and page.on('console') (level=error).
// Always tracked once a page is opened. Final assertion runs only when:
//   - the scenario is tagged @javascript (asserts no errors at scenario end), OR
//   - the test explicitly calls "Then there should be no JavaScript errors".
// Use the @js-errors tag to suppress the @javascript assertion when errors
// are intentionally expected.

const { Before, After, Then } = require('@cucumber/cucumber');
const assert = require('assert');

function hasTag(scenario, name) {
  if (!scenario || !Array.isArray(scenario.pickle && scenario.pickle.tags)) return false;
  return scenario.pickle.tags.some((t) => t.name === name);
}

Before({ order: 200 }, function (scope) {
  this._jsErrors = [];
  this._jsErrorsAsserted = false;
  this._jsErrorsAutoAssert = hasTag(scope, '@javascript');
  if (!this.page) return;
  this.page.on('pageerror', (err) => {
    this._jsErrors.push({ type: 'pageerror', message: String(err && err.message || err) });
  });
  this.page.on('console', (msg) => {
    if (msg.type() === 'error') {
      this._jsErrors.push({ type: 'console.error', message: msg.text() });
    }
  });
});

/**
 * Assert that no JavaScript errors have been collected so far.
 *
 * Errors are tracked from page open (page errors + console.error). Calling
 * this step asserts the error log is empty and prevents the auto-assert at
 * scenario end (so it does not double-fire).
 *
 * Example #1: Then there should be no JavaScript errors
 * Example #2: Given I am on the homepage
 *               Then there should be no JavaScript errors
 * Example #3: When I follow "Pricing"
 *               And I wait until the network is idle
 *               Then there should be no JavaScript errors
 * Example #4: When I press "Add to cart"
 *               Then there should be no JavaScript errors
 * Example #5: Given I am on "/dashboard"
 *               And I scroll to the bottom
 *               Then there should be no JavaScript errors
 *
 */
Then(/^there should be no JavaScript errors$/, function () {
  this._jsErrorsAsserted = true;
  const errs = this._jsErrors || [];
  if (errs.length === 0) return;
  const summary = errs.map((e, i) => `  ${i + 1}. [${e.type}] ${e.message}`).join('\n');
  assert.fail(`JavaScript errors detected:\n${summary}`);
});

After({ order: 200 }, function (scope) {
  if (!this._jsErrorsAutoAssert) return;
  if (hasTag(scope, '@js-errors')) return;
  if (this._jsErrorsAsserted) return;
  const errs = this._jsErrors || [];
  if (errs.length === 0) return;
  const summary = errs.map((e, i) => `  ${i + 1}. [${e.type}] ${e.message}`).join('\n');
  assert.fail(`JavaScript errors detected during scenario:\n${summary}`);
});
