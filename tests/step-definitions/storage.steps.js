'use strict';

// Cookie / local storage / session storage manipulation steps.
//
// Pre-seed per-scenario state without going through the UI. Useful for
// onboarding flags, A/B-test bucket assignments, feature toggles, language
// preferences, and any cookie-driven server behaviour.
//
// Cookies are scoped to the current page's domain (or `localhost` if no page
// is loaded yet). Local storage and session storage are scoped to the current
// page's origin and require a navigated page first.

const { Given } = require('@cucumber/cucumber');
const { failure } = require('./webship');

// Local storage and session storage belong to the site of the page. On a page
// that has none (about:blank before the first "I am on", a data: page) the
// browser refuses them with a SecurityError: say so, and what to do.
async function inPageStorage(world, what, script, arg) {
  try {
    return await world.page.evaluate(script, arg);
  } catch (e) {
    if (!/SecurityError|Access is denied|operation is insecure/i.test(String((e && e.message) || ''))) throw e;
    throw failure(world.page, `Could not ${what}: the page has no site yet.`, {
      hint: 'local storage and session storage belong to the site of the page: open a page of the site first, for example: Given I am on "/"',
    });
  }
}

// A quoted key or value may hold a double quote written \" (a JSON value, a
// quoted cookie value), read as {string} reads it in the cookie assertions.
function unquote(text) {
  return String(text === undefined || text === null ? '' : text).replace(/\\"/g, '"').replace(/\\'/g, "'");
}

// ---------------------------------------------------------------------------
// Cookies — context-level
// ---------------------------------------------------------------------------

/**
 * Set a cookie on the current browser context.
 *
 * Example #1: Given the cookie "session" is set to "abc123"
 * Example #2: Given the cookie "lang" is set to "en"
 * Example #3: Given cookie "ab_bucket" is set to "variant-b"
 * Example #4: Given the cookie "consent" is set to "accepted"
 *               And I am on the homepage
 * Example #5: Given the cookie "feature_flag" is set to "enabled"
 *               And I am on "/dashboard"
 *
 */
Given(/^(?:the cookie|cookie) "((?:[^"\\]|\\.)*)" is set to "((?:[^"\\]|\\.)*)"$/, async function (name, value) {
  name = unquote(name);
  value = unquote(value);
  const url = this.page.url() && this.page.url() !== 'about:blank' ? this.page.url() : (this.launchUrl || 'http://localhost');
  const u = new URL(url);
  await this.context.addCookies([{
    name,
    value,
    domain: u.hostname,
    path: '/',
  }]);
});

/**
 * Remove a single cookie by name (other cookies preserved).
 *
 * Example #1: Given the cookie "session" is removed
 * Example #2: Given the cookie "consent" is removed
 *               When I reload the page
 *               Then I should see "Accept cookies"
 * Example #3: Given the cookie "ab_bucket" is removed
 * Example #4: Given the cookie "lang" is removed
 *               And I am on the homepage
 * Example #5: Given the cookie "feature_flag" is removed
 *               When I follow "Pricing"
 *
 */
Given(/^the cookie "((?:[^"\\]|\\.)*)" is removed$/, async function (name) {
  name = unquote(name);
  const cookies = await this.context.cookies();
  const remaining = cookies.filter((c) => c.name !== name);
  await this.context.clearCookies();
  if (remaining.length) await this.context.addCookies(remaining);
});

/**
 * Wipe every cookie on the browser context.
 *
 * Example #1: Given all cookies are cleared
 * Example #2: Given all cookies are cleared
 *               When I am on the homepage
 *               Then I should see "Sign in"
 * Example #3: Given all cookies are cleared
 *               And I am an anonymous user
 * Example #4: Given all cookies are cleared
 *               And local storage is cleared
 *               And session storage is cleared
 * Example #5: Given all cookies are cleared
 *               When I follow "Login"
 *
 */
Given(/^all cookies are cleared$/, async function () {
  await this.context.clearCookies();
});

// ---------------------------------------------------------------------------
// localStorage / sessionStorage — page-level
// ---------------------------------------------------------------------------

/**
 * Set a local storage entry on the current page.
 *
 * The page must be loaded first (local storage is per-origin). Stored value
 * is always a string — JSON-encode complex objects manually, writing each
 * double quote as \" inside the step's quotes.
 *
 * Example #1: Given the local storage "user" is set to "Alice"
 * Example #2: Given I am on the homepage
 *               And the local storage "theme" is set to "dark"
 *               When I reload the page
 *               Then "<body>" should have class "theme-dark"
 * Example #3: Given local storage "lang" is set to "fr"
 * Example #4: Given the local storage "onboarding_complete" is set to "true"
 *               And I am on "/dashboard"
 *               Then I should not see "Welcome tour"
 * Example #5: Given the local storage "feature_flag" is set to "enabled"
 *
 */
Given(/^(?:the )?local storage "((?:[^"\\]|\\.)*)" is set to "((?:[^"\\]|\\.)*)"$/, async function (key, value) {
  await inPageStorage(this, `set the local storage "${unquote(key)}"`, ({ k, v }) => localStorage.setItem(k, v), { k: unquote(key), v: unquote(value) });
});

/**
 * Remove a single local storage entry.
 *
 * Example #1: Given the local storage "user" is removed
 * Example #2: Given local storage "theme" is removed
 *               When I reload the page
 *               Then the element "body" with the attribute "class" and the value containing "theme-dark" should not exist
 * Example #3: Given the local storage "onboarding_complete" is removed
 * Example #4: Given the local storage "cart" is removed
 *               And I am on "/cart"
 *               Then I should see "Your cart is empty"
 * Example #5: Given the local storage "auth_token" is removed
 *
 */
Given(/^(?:the )?local storage "((?:[^"\\]|\\.)*)" is removed$/, async function (key) {
  await inPageStorage(this, `remove the local storage "${unquote(key)}"`, (k) => localStorage.removeItem(k), unquote(key));
});

/**
 * Wipe local storage for the current origin.
 *
 * Example #1: Given local storage is cleared
 * Example #2: Given I am on the homepage
 *               And local storage is cleared
 *               When I reload the page
 * Example #3: Given local storage is cleared
 *               And all cookies are cleared
 * Example #4: Given local storage is cleared
 *               And session storage is cleared
 * Example #5: Given local storage is cleared
 *               Then I should see "First-time visitor"
 *
 */
Given(/^local storage is cleared$/, async function () {
  await inPageStorage(this, 'clear the local storage', () => localStorage.clear());
});

/**
 * Set a session storage entry on the current page.
 *
 * Example #1: Given the session storage "checkout step" is set to "2"
 * Example #2: Given the session storage "temp form" is set to "draft"
 * Example #3: Given session storage "tab id" is set to "tab-1"
 * Example #4: Given the session storage "wizard progress" is set to "3/5"
 *               And I am on "/wizard"
 * Example #5: Given the session storage "from checkout" is set to "true"
 *               And I am on "/cart"
 *
 */
Given(/^(?:the )?session storage "((?:[^"\\]|\\.)*)" is set to "((?:[^"\\]|\\.)*)"$/, async function (key, value) {
  await inPageStorage(this, `set the session storage "${unquote(key)}"`, ({ k, v }) => sessionStorage.setItem(k, v), { k: unquote(key), v: unquote(value) });
});

/**
 * Remove a single session storage entry.
 *
 * Example #1: Given the session storage "checkout step" is removed
 * Example #2: Given session storage "temp form" is removed
 * Example #3: Given the session storage "wizard progress" is removed
 *               When I reload the page
 *               Then I should see "Step 1"
 * Example #4: Given the session storage "tab id" is removed
 * Example #5: Given the session storage "from checkout" is removed
 *
 */
Given(/^(?:the )?session storage "((?:[^"\\]|\\.)*)" is removed$/, async function (key) {
  await inPageStorage(this, `remove the session storage "${unquote(key)}"`, (k) => sessionStorage.removeItem(k), unquote(key));
});

/**
 * Wipe session storage for the current origin.
 *
 * Example #1: Given session storage is cleared
 * Example #2: Given session storage is cleared
 *               And local storage is cleared
 * Example #3: Given session storage is cleared
 *               And all cookies are cleared
 * Example #4: Given session storage is cleared
 *               When I reload the page
 * Example #5: Given session storage is cleared
 *               And I am an anonymous user
 *
 */
Given(/^session storage is cleared$/, async function () {
  await inPageStorage(this, 'clear the session storage', () => sessionStorage.clear());
});
