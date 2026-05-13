'use strict';

const { friendly } = require('./webship');

// Network interception and mocking via Playwright's `page.route()` API.
//
// Lets BDD scenarios stub external dependencies, simulate slow / offline
// conditions, and assert what the client actually requested — without
// leaving the test runner. Patterns use Playwright glob matching: `**/path`,
// `*.gif`, regex inside parentheses, etc.
//
// Order matters: register routes BEFORE the action that triggers the request.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

function ensureRequestLog(world) {
  if (world._requestLog) return;
  world._requestLog = [];
  world.page.on('request', (req) => {
    world._requestLog.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
    });
  });
}

// ---------------------------------------------------------------------------
// Stubbing
// ---------------------------------------------------------------------------

/**
 * Stub a URL pattern with a JSON response body.
 *
 * Body is sent verbatim with `Content-Type: application/json` and HTTP 200.
 *
 * Example #1: Given the URL "**\/api/users" returns the JSON:
 *               """
 *               {"users": [{"id": 1, "name": "Alice"}]}
 *               """
 * Example #2: Given the URL "**\/api/me" returns the JSON:
 *               """
 *               {"id": 1, "name": "Alice", "role": "admin"}
 *               """
 * Example #3: Given the URL "**\/api/products?*" returns the JSON:
 *               """
 *               {"items": [], "total": 0}
 *               """
 * Example #4: Given the URL "https://api.stripe.com/v1/charges" returns the JSON:
 *               """
 *               {"id": "ch_test", "status": "succeeded"}
 *               """
 * Example #5: Given the URL "**\/api/feature-flags" returns the JSON:
 *               """
 *               {"darkMode": true, "betaUI": false}
 *               """
 *
 */
Given(/^the URL "([^"]*)" returns the JSON:$/, async function (urlPattern, body) {
  try {
    await this.page.route(urlPattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });
  } catch (e) {
    throw friendly({
      action: `register a JSON stub for "${urlPattern}"`,
      cause: e,
      hint: `URL pattern uses glob syntax — try "**/api/users" or "*.png".`,
    });
  }
});

/**
 * Stub a URL pattern with a status code and plain-text body.
 *
 * Example #1: Given the URL "**\/api/login" returns status 401 with body "Unauthorized"
 * Example #2: Given the URL "**\/api/health" returns status 503
 * Example #3: Given the URL "**\/api/users" returns status 500 with body "Database down"
 * Example #4: Given the URL "**\/api/orders/*" returns status 404
 * Example #5: Given the URL "**\/api/admin/*" returns status 403 with body "Forbidden"
 *
 */
Given(/^the URL "([^"]*)" returns status (\d+)(?: with body "([^"]*)")?$/, async function (urlPattern, status, body) {
  try {
    await this.page.route(urlPattern, async (route) => {
      await route.fulfill({ status: parseInt(status, 10), body: body || '' });
    });
  } catch (e) {
    throw friendly({
      action: `register a status-${status} stub for "${urlPattern}"`,
      cause: e,
      hint: `URL pattern uses glob syntax — try "**/api/users" or "*.png".`,
    });
  }
});

/**
 * Block a URL pattern entirely (network failure simulation).
 *
 * Example #1: Given the URL "**\/analytics.js" is blocked
 * Example #2: Given the URL "**\/google-analytics.com/**" is blocked
 * Example #3: Given the URL "**\/sentry.io/**" is blocked
 * Example #4: Given the URL "*.gif" is blocked
 * Example #5: Given the URL "**\/api/tracking" is blocked
 *
 */
Given(/^the URL "([^"]*)" is blocked$/, async function (urlPattern) {
  try {
    await this.page.route(urlPattern, (route) => route.abort());
  } catch (e) {
    throw friendly({
      action: `block "${urlPattern}"`,
      cause: e,
      hint: `URL pattern uses glob syntax — try "**/analytics.js" or "*.gif".`,
    });
  }
});

/**
 * Delay matching requests by N milliseconds (slow-network simulation).
 *
 * The request still completes against the real upstream — only its arrival
 * time at the page is shifted. Useful for verifying loading-state UI.
 *
 * Example #1: Given the URL "**\/api/**" is delayed by 1500 ms
 * Example #2: Given the URL "**\/api/users" is delayed by 3000 ms
 * Example #3: Given the URL "**\/api/heavy-report" is delayed by 5000 ms
 * Example #4: Given the URL "*.png" is delayed by 500 ms
 * Example #5: Given the URL "**\/api/checkout" is delayed by 2000 ms
 *
 */
Given(/^the URL "([^"]*)" is delayed by (\d+) ?ms$/, async function (urlPattern, delay) {
  const ms = parseInt(delay, 10);
  try {
    await this.page.route(urlPattern, async (route) => {
      await new Promise((r) => setTimeout(r, ms));
      await route.continue();
    });
  } catch (e) {
    throw friendly({
      action: `delay "${urlPattern}" by ${ms} ms`,
      cause: e,
      hint: `URL pattern uses glob syntax — try "**/api/**" or "*.png".`,
    });
  }
});

/**
 * Simulate offline mode for the rest of the scenario.
 *
 * Example #1: Given the network is offline
 * Example #2: Given I am on the homepage
 *               When the network is offline
 *               And I follow "Refresh"
 *               Then I should see "Offline"
 * Example #3: When the network is offline
 *               And I press "Sync"
 *               Then I should see "Cannot reach server"
 * Example #4: Given the network is offline
 *               And I am on "/dashboard"
 * Example #5: Given the network is offline
 *               When I click "Reload"
 *               Then "<.error-banner>" should be visible
 *
 */
Given(/^the network is offline$/, async function () {
  try { await this.context.setOffline(true); }
  catch (e) { throw friendly({ action: 'switch the network offline', cause: e, hint: 'the browser context may have been closed; try a fresh scenario.' }); }
});

/**
 * Restore network connectivity after `the network is offline`.
 *
 * Example #1: Given the network is online
 * Example #2: When the network is offline
 *               And I press "Sync"
 *               Then I should see "Cannot reach server"
 *               When the network is online
 *               And I press "Retry"
 *               Then I should see "Synced"
 * Example #3: Given the network is online
 *               And I am on the homepage
 * Example #4: When the network is online
 * Example #5: Given the network is online
 *               When I follow "Reload"
 *               Then I should see "Welcome"
 *
 */
Given(/^the network is online$/, async function () {
  try { await this.context.setOffline(false); }
  catch (e) { throw friendly({ action: 'switch the network online', cause: e, hint: 'the browser context may have been closed; try a fresh scenario.' }); }
});

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------

/**
 * Start recording every outgoing request for later assertion.
 *
 * Example #1: Given I start recording network requests
 * Example #2: Given I start recording network requests
 *               When I press "Buy now"
 *               Then a POST request to "**\/api/checkout" should have been made
 * Example #3: Given we start recording network requests
 * Example #4: Given I start recording network requests
 *               When I follow "Pricing"
 *               Then no request to "**\/tracking" should have been made
 * Example #5: Given I start recording network requests
 *               When I scroll to the bottom
 *               Then a GET request to "**\/api/feed/page=2" should have been made
 *
 */
Given(/^(I |we )*start recording network requests$/, function () {
  ensureRequestLog(this);
});

/**
 * Assert at least one request matching a URL pattern was recorded.
 *
 * Patterns use simple `*` wildcards (regex internally).
 *
 * Example #1: Then a request to "**\/api/users" should have been made
 * Example #2: Then a request to "**\/api/checkout" should have been made
 * Example #3: Then a request to "**\/api/orders/*" should have been made
 * Example #4: Then a request to "*.css" should have been made
 * Example #5: Then a request to "https://api.example.com/**" should have been made
 *
 */
Then(/^a request to "([^"]*)" should have been made$/, function (urlPattern) {
  ensureRequestLog(this);
  let re;
  try { re = new RegExp(urlPattern.replace(/\*/g, '.*')); }
  catch (e) { throw friendly({ action: `match URL pattern "${urlPattern}"`, cause: e, hint: "URL pattern must be a valid regex or glob; check for unmatched brackets." }); }
  const found = this._requestLog.some((r) => re.test(r.url));
  assert.ok(found, `Expected at least one request matching "${urlPattern}".`);
});

/**
 * Assert at least one HTTP-method-specific request was recorded.
 *
 * Example #1: Then a GET request to "**\/api/users" should have been made
 * Example #2: Then a POST request to "**\/api/login" should have been made
 * Example #3: Then a PUT request to "**\/api/users/1" should have been made
 * Example #4: Then a PATCH request to "**\/api/orders/*" should have been made
 * Example #5: Then a DELETE request to "**\/api/cart/items/*" should have been made
 *
 */
Then(/^a (GET|POST|PUT|PATCH|DELETE) request to "([^"]*)" should have been made$/, function (method, urlPattern) {
  ensureRequestLog(this);
  let re;
  try { re = new RegExp(urlPattern.replace(/\*/g, '.*')); }
  catch (e) { throw friendly({ action: `match URL pattern "${urlPattern}"`, cause: e, hint: "URL pattern must be a valid regex or glob; check for unmatched brackets." }); }
  const found = this._requestLog.some((r) => r.method === method && re.test(r.url));
  assert.ok(found, `Expected at least one ${method} request matching "${urlPattern}".`);
});

/**
 * Assert NO request matching a URL pattern was recorded.
 *
 * Example #1: Then no request to "**\/tracking" should have been made
 * Example #2: Then no request to "**\/google-analytics.com/**" should have been made
 * Example #3: Then no request to "**\/api/admin/**" should have been made
 * Example #4: Then no request to "*.gif" should have been made
 * Example #5: Then no request to "**\/api/v1/legacy/**" should have been made
 *
 */
Then(/^no request to "([^"]*)" should have been made$/, function (urlPattern) {
  ensureRequestLog(this);
  let re;
  try { re = new RegExp(urlPattern.replace(/\*/g, '.*')); }
  catch (e) { throw friendly({ action: `match URL pattern "${urlPattern}"`, cause: e, hint: "URL pattern must be a valid regex or glob; check for unmatched brackets." }); }
  const found = this._requestLog.some((r) => re.test(r.url));
  assert.ok(!found, `Did not expect any request matching "${urlPattern}".`);
});
