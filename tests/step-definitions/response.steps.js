'use strict';

// Inspect HTTP response headers using Playwright's request API on the current page URL.

const { Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');

// Capture response headers from navigation events, with page.request fallback.
Before({ order: 100 }, async function () {
  if (!this.page) return;
  this._lastResponseHeaders = null;
  this._lastResponseStatus = null;
  this.page.on('response', (resp) => {
    try {
      if (resp.request().isNavigationRequest() && resp.frame() === this.page.mainFrame()) {
        this._lastResponseHeaders = resp.headers();
        this._lastResponseStatus = resp.status();
      }
    } catch (e) { /* ignore */ }
  });
});

async function getHeaders(world) {
  if (world._lastResponseHeaders) return world._lastResponseHeaders;
  // Fallback: fetch current URL via Playwright request context to get headers.
  const url = world.page.url();
  if (!url || url === 'about:blank') return {};
  try {
    const resp = await world.page.request.get(url);
    return resp.headers();
  } catch (e) {
    return {};
  }
}

/**
 * Assert the most recent navigation response carried a header (case-insensitive).
 *
 * Example #1: Then the response should contain the header "content-type"
 * Example #2: Then the response should contain the header "cache-control"
 * Example #3: And the response should contain the header "x-frame-options"
 * Example #4: Then the response should contain the header "set-cookie"
 * Example #5: Then the response should contain the header "etag"
 *
 */
Then('the response should contain the header {string}', async function (name) {
  const h = await getHeaders(this);
  assert.ok(Object.keys(h).map((k) => k.toLowerCase()).includes(name.toLowerCase()), `Header "${name}" not present.`);
});

/**
 * Assert the most recent navigation response did NOT carry a header.
 *
 * Example #1: Then the response should not contain the header "x-fake-header"
 * Example #2: Then the response should not contain the header "x-powered-by"
 * Example #3: And the response should not contain the header "server"
 * Example #4: Then the response should not contain the header "x-aspnet-version"
 * Example #5: Then the response should not contain the header "x-debug-token"
 *
 */
Then('the response should not contain the header {string}', async function (name) {
  const h = await getHeaders(this);
  assert.ok(!Object.keys(h).map((k) => k.toLowerCase()).includes(name.toLowerCase()), `Header "${name}" should not be present.`);
});

/**
 * Assert a header's value contains a substring.
 *
 * Example #1: Then the response header "content-type" should contain the value "html"
 * Example #2: Then the response header "cache-control" should contain the value "no-cache"
 * Example #3: And the response header "content-type" should contain the value "charset=utf-8"
 * Example #4: Then the response header "set-cookie" should contain the value "session="
 * Example #5: Then the response header "x-frame-options" should contain the value "DENY"
 *
 */
Then('the response header {string} should contain the value {string}', async function (name, value) {
  const h = await getHeaders(this);
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  assert.ok(key, `Header "${name}" not present.`);
  assert.ok(String(h[key]).indexOf(value) !== -1, `Header "${name}"="${h[key]}" does not contain "${value}".`);
});

/**
 * Assert a header's value does NOT contain a substring (or the header is absent).
 *
 * Example #1: Then the response header "content-type" should not contain the value "application/json"
 * Example #2: Then the response header "cache-control" should not contain the value "public"
 * Example #3: And the response header "content-type" should not contain the value "xml"
 * Example #4: Then the response header "set-cookie" should not contain the value "Domain=other"
 * Example #5: Then the response header "x-frame-options" should not contain the value "ALLOW"
 *
 */
Then('the response header {string} should not contain the value {string}', async function (name, value) {
  const h = await getHeaders(this);
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  if (!key) return;
  assert.ok(String(h[key]).indexOf(value) === -1, `Header "${name}" should not contain "${value}".`);
});
