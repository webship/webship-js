'use strict';

// Lightweight REST testing — distinct from the existing api.steps.js steps
// Preserves exact step phrasing for compatibility.
//
// A REST request is sent through the browser context, so it follows the
// browser session: its cookies, its credentials and its HTTPS setting (a
// self-signed or locally issued certificate is accepted like in the page).

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { resolveUrl, sendRequest, friendly } = require('./webship');

function ensureState(world) {
  if (!world._rest) world._rest = { headers: {}, response: null };
  return world._rest;
}

async function sendRest(world, method, url, body) {
  const s = ensureState(world);
  const target = resolveUrl(world.launchUrl, url);
  try {
    s.response = await sendRequest(world, {
      method, url: target, headers: s.headers, data: body, session: true,
    });
  } catch (e) {
    throw friendly({
      action: `send the REST ${method} request to "${target}"`,
      cause: e,
      hint: 'check the URL is reachable from the machine that runs the tests.',
    });
  }
}

/**
 * Add an HTTP header to subsequent REST requests.
 *
 * Example #1: Given a REST header "Authorization" with value "Bearer abc123"
 * Example #2: Given a REST header "Accept" with value "application/json"
 * Example #3: And a REST header "X-Request-ID" with value "req-001"
 * Example #4: Given a REST header "Content-Type" with value "application/json"
 * Example #5: Given a REST header "X-API-Key" with value "key-xyz"
 *
 */
Given('a REST header {string} with value {string}', async function (name, value) {
  ensureState(this).headers[name] = value;
});

/**
 * Send an HTTP request without a body.
 *
 * Example #1: When I send a REST "GET" request to "/api/users"
 * Example #2: When I send a REST "DELETE" request to "/api/orders/1"
 * Example #3: And we send a REST "GET" request to "https://example.com/api/health"
 * Example #4: When I send a REST "GET" request to "/api/me"
 * Example #5: When I send a REST "DELETE" request to "/api/cart/items/42"
 *
 */
When(/^(I |we )*send a REST "([^"]*)" request to "([^"]*)"$/, async function (pronoun, method, url) {
  await sendRest(this, method, url);
});

/**
 * Send an HTTP request with a doc-string body (raw text, JSON, or form-encoded).
 *
 * Example #1: When I send a REST "POST" request to "/api/users" with body:
 *               """
 *               {"name": "Alice"}
 *               """
 * Example #2: When I send a REST "PUT" request to "/api/users/1" with body:
 *               """
 *               {"role": "admin"}
 *               """
 * Example #3: And we send a REST "PATCH" request to "/api/orders/1" with body:
 *               """
 *               {"status": "shipped"}
 *               """
 * Example #4: When I send a REST "POST" request to "/api/login" with body:
 *               """
 *               username=alice&password=s3cret
 *               """
 * Example #5: When I send a REST "POST" request to "/webhooks/event" with body:
 *               """
 *               {"event": "ping"}
 *               """
 *
 */
When(/^(I |we )*send a REST "([^"]*)" request to "([^"]*)" with body:$/, async function (pronoun, method, url, body) {
  await sendRest(this, method, url, body);
});

/**
 * Assert the most recent REST response carried an expected status code.
 *
 * Example #1: Then the REST response status code should be 200
 * Example #2: Then the REST response status code should be 201
 * Example #3: And the REST response status code should be 401
 * Example #4: Then the REST response status code should be 404
 * Example #5: Then the REST response status code should be 500
 *
 */
Then('the REST response status code should be {int}', async function (code) {
  const s = ensureState(this);
  assert.ok(s.response, 'No REST response captured.');
  assert.strictEqual(s.response.status, code);
});

/**
 * Assert the most recent REST response body contains a substring.
 *
 * Example #1: Then the REST response should contain "Alice"
 * Example #2: Then the REST response should contain "id"
 * Example #3: And the REST response should contain "shipped"
 * Example #4: Then the REST response should contain "ok"
 * Example #5: Then the REST response should contain "Welcome"
 *
 */
Then('the REST response should contain {string}', async function (text) {
  const s = ensureState(this);
  assert.ok(s.response, 'No REST response captured.');
  const body = typeof s.response.data === 'string' ? s.response.data : JSON.stringify(s.response.data);
  assert.ok(body.indexOf(text) !== -1, `REST response does not contain "${text}".`);
});
