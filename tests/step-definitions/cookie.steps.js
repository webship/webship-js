'use strict';

// Cookie existence and value assertions (exact and partial matching) using
// Playwright's `BrowserContext.cookies()` API.

const { Then } = require('@cucumber/cucumber');
const assert = require('assert');

async function getCookies(world) {
  return world.context ? await world.context.cookies() : [];
}

function findByName(cookies, name) {
  return cookies.find((c) => c.name === name);
}

function findByPartialName(cookies, partial) {
  return cookies.find((c) => c.name.indexOf(partial) !== -1);
}

/**
 * Assert that a cookie with the exact name exists in the browser context.
 *
 * Example #1: Then a cookie with the name "session_id" should exist
 * Example #2: Then a cookie with the name "auth_token" should exist
 * Example #3: And a cookie with the name "lang" should exist
 * Example #4: Then a cookie with the name "consent" should exist
 * Example #5: When I press "Sign in"
 *               Then a cookie with the name "session" should exist
 *
 */
Then('a cookie with the name {string} should exist', async function (name) {
  const cookies = await getCookies(this);
  assert.ok(findByName(cookies, name), `Cookie "${name}" was not found.`);
});

/**
 * Assert that a cookie with the exact name AND exact value exists.
 *
 * Example #1: Then a cookie with the name "lang" and the value "en" should exist
 * Example #2: Then a cookie with the name "consent" and the value "accepted" should exist
 * Example #3: And a cookie with the name "ab_bucket" and the value "variant-b" should exist
 * Example #4: Then a cookie with the name "theme" and the value "dark" should exist
 * Example #5: When I check "Remember me"
 *               And I press "Sign in"
 *               Then a cookie with the name "remember" and the value "1" should exist
 *
 */
Then('a cookie with the name {string} and the value {string} should exist', async function (name, value) {
  const cookies = await getCookies(this);
  const c = findByName(cookies, name);
  assert.ok(c, `Cookie "${name}" was not found.`);
  assert.strictEqual(c.value, value, `Cookie "${name}" has value "${c.value}", expected "${value}".`);
});

/**
 * Assert a cookie with the exact name has a value containing a substring.
 *
 * Example #1: Then a cookie with the name "session_id" and a value containing "abc" should exist
 * Example #2: Then a cookie with the name "auth" and a value containing "Bearer" should exist
 * Example #3: And a cookie with the name "preferences" and a value containing "darkmode" should exist
 * Example #4: Then a cookie with the name "tracking" and a value containing "v2-" should exist
 * Example #5: Then a cookie with the name "csrf" and a value containing "token=" should exist
 *
 */
Then('a cookie with the name {string} and a value containing {string} should exist', async function (name, partial) {
  const cookies = await getCookies(this);
  const c = findByName(cookies, name);
  assert.ok(c, `Cookie "${name}" was not found.`);
  assert.ok(c.value.indexOf(partial) !== -1, `Cookie "${name}" value "${c.value}" does not contain "${partial}".`);
});

/**
 * Assert a cookie whose name contains a substring exists.
 *
 * Example #1: Then a cookie with a name containing "session" should exist
 * Example #2: Then a cookie with a name containing "_csrf" should exist
 * Example #3: And a cookie with a name containing "tracking" should exist
 * Example #4: Then a cookie with a name containing "auth" should exist
 * Example #5: Then a cookie with a name containing "lang_" should exist
 *
 */
Then('a cookie with a name containing {string} should exist', async function (partial) {
  const cookies = await getCookies(this);
  assert.ok(findByPartialName(cookies, partial), `No cookie with name containing "${partial}" was found.`);
});

/**
 * Assert a cookie whose name contains a substring has the exact value.
 *
 * Example #1: Then a cookie with a name containing "session" and the value "active" should exist
 * Example #2: Then a cookie with a name containing "auth" and the value "1" should exist
 * Example #3: And a cookie with a name containing "lang_" and the value "en" should exist
 * Example #4: Then a cookie with a name containing "feature_" and the value "on" should exist
 * Example #5: Then a cookie with a name containing "_pref" and the value "dark" should exist
 *
 */
Then('a cookie with a name containing {string} and the value {string} should exist', async function (partial, value) {
  const cookies = await getCookies(this);
  const found = cookies.find((c) => c.name.indexOf(partial) !== -1 && c.value === value);
  assert.ok(found, `No cookie with name containing "${partial}" and value "${value}" was found.`);
});

/**
 * Assert a cookie whose name contains substring A has a value containing substring B.
 *
 * Example #1: Then a cookie with a name containing "session" and a value containing "active" should exist
 * Example #2: Then a cookie with a name containing "auth" and a value containing "Bearer" should exist
 * Example #3: And a cookie with a name containing "tracking" and a value containing "v2-" should exist
 * Example #4: Then a cookie with a name containing "csrf" and a value containing "token=" should exist
 * Example #5: Then a cookie with a name containing "_pref" and a value containing "dark" should exist
 *
 */
Then('a cookie with a name containing {string} and a value containing {string} should exist', async function (partialName, partialValue) {
  const cookies = await getCookies(this);
  const found = cookies.find((c) => c.name.indexOf(partialName) !== -1 && c.value.indexOf(partialValue) !== -1);
  assert.ok(found, `No cookie with name containing "${partialName}" and value containing "${partialValue}" was found.`);
});

/**
 * Assert a cookie with the exact name does NOT exist.
 *
 * Example #1: Then a cookie with the name "session_id" should not exist
 * Example #2: Then a cookie with the name "auth_token" should not exist
 * Example #3: And a cookie with the name "tracking" should not exist
 * Example #4: When I press "Logout"
 *               Then a cookie with the name "session" should not exist
 * Example #5: Given all cookies are cleared
 *               Then a cookie with the name "lang" should not exist
 *
 */
Then('a cookie with the name {string} should not exist', async function (name) {
  const cookies = await getCookies(this);
  assert.ok(!findByName(cookies, name), `Cookie "${name}" should not exist but it does.`);
});

/**
 * Assert a cookie with the exact name+value does NOT exist.
 *
 * Example #1: Then a cookie with the name "lang" and the value "fr" should not exist
 * Example #2: Then a cookie with the name "consent" and the value "rejected" should not exist
 * Example #3: And a cookie with the name "theme" and the value "dark" should not exist
 * Example #4: Then a cookie with the name "ab_bucket" and the value "variant-c" should not exist
 * Example #5: Then a cookie with the name "remember" and the value "0" should not exist
 *
 */
Then('a cookie with the name {string} and the value {string} should not exist', async function (name, value) {
  const cookies = await getCookies(this);
  const c = findByName(cookies, name);
  assert.ok(!c || c.value !== value, `Cookie "${name}" with value "${value}" should not exist.`);
});

/**
 * Assert a cookie with the exact name does not contain a substring in its value.
 *
 * Example #1: Then a cookie with the name "preferences" and a value containing "lightmode" should not exist
 * Example #2: Then a cookie with the name "tracking" and a value containing "v1-" should not exist
 * Example #3: And a cookie with the name "auth" and a value containing "Basic" should not exist
 * Example #4: Then a cookie with the name "session" and a value containing "expired" should not exist
 * Example #5: Then a cookie with the name "csrf" and a value containing "invalid" should not exist
 *
 */
Then('a cookie with the name {string} and a value containing {string} should not exist', async function (name, partial) {
  const cookies = await getCookies(this);
  const c = findByName(cookies, name);
  assert.ok(!c || c.value.indexOf(partial) === -1, `Cookie "${name}" should not contain value "${partial}".`);
});

/**
 * Assert no cookie name contains a substring.
 *
 * Example #1: Then a cookie with a name containing "old_" should not exist
 * Example #2: Then a cookie with a name containing "_legacy" should not exist
 * Example #3: And a cookie with a name containing "deprecated" should not exist
 * Example #4: Given all cookies are cleared
 *               Then a cookie with a name containing "session" should not exist
 * Example #5: When I press "Logout"
 *               Then a cookie with a name containing "auth" should not exist
 *
 */
Then('a cookie with a name containing {string} should not exist', async function (partial) {
  const cookies = await getCookies(this);
  assert.ok(!findByPartialName(cookies, partial), `Cookie with name containing "${partial}" should not exist.`);
});

/**
 * Assert no cookie name+value pair (with partial name) matches.
 *
 * Example #1: Then a cookie with a name containing "session" and the value "expired" should not exist
 * Example #2: Then a cookie with a name containing "auth" and the value "anonymous" should not exist
 * Example #3: And a cookie with a name containing "feature_" and the value "off" should not exist
 * Example #4: Then a cookie with a name containing "lang_" and the value "xx" should not exist
 * Example #5: Then a cookie with a name containing "_pref" and the value "default" should not exist
 *
 */
Then('a cookie with a name containing {string} and the value {string} should not exist', async function (partial, value) {
  const cookies = await getCookies(this);
  const found = cookies.find((c) => c.name.indexOf(partial) !== -1 && c.value === value);
  assert.ok(!found, `Cookie with name containing "${partial}" and value "${value}" should not exist.`);
});

/**
 * Assert no cookie partial-name + partial-value pair matches.
 *
 * Example #1: Then a cookie with a name containing "session" and a value containing "old" should not exist
 * Example #2: Then a cookie with a name containing "auth" and a value containing "Basic" should not exist
 * Example #3: And a cookie with a name containing "tracking" and a value containing "v0-" should not exist
 * Example #4: Then a cookie with a name containing "_pref" and a value containing "lightmode" should not exist
 * Example #5: Then a cookie with a name containing "csrf" and a value containing "invalid" should not exist
 *
 */
Then('a cookie with a name containing {string} and a value containing {string} should not exist', async function (partialName, partialValue) {
  const cookies = await getCookies(this);
  const found = cookies.find((c) => c.name.indexOf(partialName) !== -1 && c.value.indexOf(partialValue) !== -1);
  assert.ok(!found, `Cookie with name containing "${partialName}" and value containing "${partialValue}" should not exist.`);
});
