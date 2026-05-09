'use strict';

// URL path and query parameter assertions, basic auth, history navigation.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

function currentUrl(page) { return new URL(page.url()); }

/**
 * Assert the current URL pathname equals an expected string (no query/fragment).
 *
 * Example #1: Then the path should be "/dashboard"
 * Example #2: Then the path should be "/about"
 * Example #3: And the path should be "/checkout/step-2"
 * Example #4: Then the path should be "/admin/users"
 * Example #5: Then the path should be "/"
 *
 */
Then('the path should be {string}', async function (path) {
  assert.strictEqual(currentUrl(this.page).pathname, path);
});

/**
 * Assert the current URL pathname is NOT equal to an expected string.
 *
 * Example #1: Then the path should not be "/login"
 * Example #2: Then the path should not be "/error"
 * Example #3: And the path should not be "/admin"
 * Example #4: Then the path should not be "/maintenance"
 * Example #5: Then the path should not be "/forbidden"
 *
 */
Then('the path should not be {string}', async function (path) {
  assert.notStrictEqual(currentUrl(this.page).pathname, path);
});

/**
 * Assert the current URL has the named query parameter (any value).
 *
 * Example #1: Then current url should have the "lang" parameter
 * Example #2: Then current url should have the "page" parameter
 * Example #3: And current url should have the "q" parameter
 * Example #4: Then current url should have the "ref" parameter
 * Example #5: Then current url should have the "sort" parameter
 *
 */
Then('current url should have the {string} parameter', async function (param) {
  const u = currentUrl(this.page);
  assert.ok(u.searchParams.has(param), `Query param "${param}" not present in ${u.href}.`);
});

/**
 * Assert the current URL has the named query parameter with the exact value.
 *
 * Example #1: Then current url should have the "lang" parameter with the "en" value
 * Example #2: Then current url should have the "page" parameter with the "2" value
 * Example #3: And current url should have the "sort" parameter with the "price" value
 * Example #4: Then current url should have the "ref" parameter with the "newsletter" value
 * Example #5: Then current url should have the "q" parameter with the "laptops" value
 *
 */
Then('current url should have the {string} parameter with the {string} value', async function (param, value) {
  const u = currentUrl(this.page);
  assert.strictEqual(u.searchParams.get(param), value);
});

/**
 * Assert the current URL does NOT carry the named query parameter.
 *
 * Example #1: Then current url should not have the "missing" parameter
 * Example #2: Then current url should not have the "debug" parameter
 * Example #3: And current url should not have the "preview" parameter
 * Example #4: Then current url should not have the "force" parameter
 * Example #5: Then current url should not have the "test" parameter
 *
 */
Then('current url should not have the {string} parameter', async function (param) {
  const u = currentUrl(this.page);
  assert.ok(!u.searchParams.has(param), `Query param "${param}" should not be present.`);
});

/**
 * Assert the current URL does NOT carry a parameter+value pair.
 *
 * Example #1: Then current url should not have the "lang" parameter with the "fr" value
 * Example #2: Then current url should not have the "page" parameter with the "100" value
 * Example #3: And current url should not have the "sort" parameter with the "old" value
 * Example #4: Then current url should not have the "preview" parameter with the "1" value
 * Example #5: Then current url should not have the "debug" parameter with the "true" value
 *
 */
Then('current url should not have the {string} parameter with the {string} value', async function (param, value) {
  const u = currentUrl(this.page);
  assert.notStrictEqual(u.searchParams.get(param), value);
});

/**
 * Re-open the browser context with HTTP basic-auth credentials.
 *
 * Example #1: Given the basic authentication with the username "admin" and the password "secret"
 * Example #2: Given the basic authentication with the username "guest" and the password "guest"
 * Example #3: And the basic authentication with the username "alice" and the password "s3cret"
 * Example #4: Given the basic authentication with the username "ci" and the password "ci-token-123"
 * Example #5: Given the basic authentication with the username "tester" and the password ""
 *
 */
Given('the basic authentication with the username {string} and the password {string}', async function (user, pass) {
  // Replace context with one that has HTTP basic auth credentials.
  await this.context.close();
  const playwright = require('playwright');
  const playwrightConfig = require(require('path').join(process.cwd(), 'playwright.config'));
  this.context = await this.playwrightBrowser.newContext({
    ...playwrightConfig.contextOptions,
    httpCredentials: { username: user, password: pass },
  });
  this.page = await this.context.newPage();
});

/**
 * Navigate one step back in the browser history.
 *
 * Equivalent to clicking the browser back button. Throws no error if there
 * is no history (returns null from `page.goBack()`).
 *
 * Example #1: When I go back
 * Example #2: When I follow "About"
 *               And I go back
 *               Then I should be on the homepage
 * Example #3: And I go back
 * Example #4: When I am on "/cart"
 *               When I am on "/checkout"
 *               And I go back
 *               Then I should be on "/cart"
 * Example #5: When I go back
 *               And I wait until the URL contains "/products"
 *
 */
When(/^(I |we )*go back$/, async function (pronoun) {
  await this.page.goBack();
});
