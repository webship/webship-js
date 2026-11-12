'use strict';

// Inspect the HTTP response of the page the browser is showing: its status
// code and its headers. Both are read from the response the browser itself
// received for the main document, so they follow the browser session — its
// cookies, its HTTPS settings, any stubbed route — and never a second request
// sent from outside the browser.

const { Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');
const { friendly } = require('./webship');

const trackedPages = new WeakSet();

// A URL without its fragment: "#section" never loads a new document.
function withoutHash(url) {
  return String(url || '').split('#')[0];
}

// Record the response of every main-document navigation on the current page.
// Steps that swap the page (auth state, basic authentication, a new session)
// get the listener on their first use of the response steps.
function trackResponses(world) {
  const page = world.page;
  if (!page || trackedPages.has(page)) return;
  trackedPages.add(page);
  page.on('response', (resp) => {
    try {
      if (resp.request().isNavigationRequest() && resp.frame() === page.mainFrame()) {
        world._lastResponse = { page, url: resp.url(), status: resp.status(), headers: resp.headers() };
        world._lastResponseHeaders = world._lastResponse.headers;
        world._lastResponseStatus = world._lastResponse.status;
      }
    } catch (e) { /* ignore */ }
  });
}

Before({ order: 100 }, async function () {
  this._lastResponse = null;
  this._lastResponseHeaders = null;
  this._lastResponseStatus = null;
  trackResponses(this);
});

/**
 * The response of the document the page is showing: { status, headers }.
 *
 * The recorded navigation response answers when it belongs to the current
 * page and URL. Anything else — a page opened before the listener was there,
 * a history move served from the browser cache, a URL changed by the History
 * API — is asked for again through the browser context, which shares the
 * session cookies and the HTTPS settings of the page.
 */
async function getLastResponse(world) {
  const page = world.page;
  if (!page) throw friendly('No page is open, so there is no response to read.');
  trackResponses(world);
  const url = page.url();
  const last = world._lastResponse;
  // 304 Not Modified only says the cached copy is still good: ask again for
  // the status of the document itself.
  if (last && last.page === page && last.status !== 304 && withoutHash(last.url) === withoutHash(url)) {
    return last;
  }
  if (!url || url === 'about:blank') {
    throw friendly({
      message: 'No page has been opened yet, so there is no response to read.',
      hint: 'open a page first, for example: Given I am on "/".',
    });
  }
  try {
    const resp = await page.request.get(url);
    return { page, url, status: resp.status(), headers: resp.headers() };
  } catch (e) {
    throw friendly(`Could not read the response of "${url}".`, e);
  }
}

async function getHeaders(world) {
  return (await getLastResponse(world)).headers || {};
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

module.exports = { getLastResponse };
