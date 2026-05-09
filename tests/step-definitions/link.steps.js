'use strict';

// Link existence + href + title assertions.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

function linkSelector(text) {
  return `a:has-text("${text}")`;
}

/**
 * Assert a link with the given visible text and an href containing a fragment exists.
 *
 * Example #1: Then the link "About" with the href "/about" should exist
 * Example #2: Then the link "Sign in" with the href "/login" should exist
 * Example #3: And the link "Pricing" with the href "/pricing" should exist
 * Example #4: Then the link "Docs" with the href "docs.example.com" should exist
 * Example #5: Then the link "Contact" with the href "/contact-us" should exist
 *
 */
Then('the link {string} with the href {string} should exist', async function (text, href) {
  const loc = this.page.locator(`${linkSelector(text)}[href*="${href}"]`);
  assert.ok(await loc.count() > 0, `Link "${text}" with href containing "${href}" not found.`);
});

/**
 * Assert a link exists inside a specific parent element.
 *
 * Example #1: Then the link "Home" with the href "/" within the element "#main-nav" should exist
 * Example #2: Then the link "Privacy" with the href "/privacy" within the element "footer" should exist
 * Example #3: And the link "Sign in" with the href "/login" within the element ".header" should exist
 * Example #4: Then the link "Docs" with the href "/docs" within the element "nav" should exist
 * Example #5: Then the link "Pricing" with the href "/pricing" within the element ".cta-block" should exist
 *
 */
Then('the link {string} with the href {string} within the element {string} should exist', async function (text, href, parent) {
  const loc = this.page.locator(`${parent} ${linkSelector(text)}[href*="${href}"]`);
  assert.ok(await loc.count() > 0, `Link "${text}" with href containing "${href}" not found within "${parent}".`);
});

/**
 * Assert NO link with the given visible text and href fragment exists.
 *
 * Example #1: Then the link "Sign in" with the href "/login" should not exist
 * Example #2: Then the link "Admin" with the href "/admin" should not exist
 * Example #3: And the link "Old docs" with the href "/v1/docs" should not exist
 * Example #4: Then the link "Logout" with the href "/logout" should not exist
 * Example #5: Then the link "Beta" with the href "/beta" should not exist
 *
 */
Then('the link {string} with the href {string} should not exist', async function (text, href) {
  const loc = this.page.locator(`${linkSelector(text)}[href*="${href}"]`);
  assert.strictEqual(await loc.count(), 0, `Link "${text}" with href containing "${href}" should not exist.`);
});

/**
 * Assert NO link with text+href exists inside a specific parent element.
 *
 * Example #1: Then the link "Logout" with the href "/logout" within the element ".guest-nav" should not exist
 * Example #2: Then the link "Admin" with the href "/admin" within the element "footer" should not exist
 * Example #3: And the link "Beta" with the href "/beta" within the element "#main-nav" should not exist
 * Example #4: Then the link "Old" with the href "/v1" within the element ".breadcrumb" should not exist
 * Example #5: Then the link "Internal" with the href "/internal" within the element ".public-nav" should not exist
 *
 */
Then('the link {string} with the href {string} within the element {string} should not exist', async function (text, href, parent) {
  const loc = this.page.locator(`${parent} ${linkSelector(text)}[href*="${href}"]`);
  assert.strictEqual(await loc.count(), 0, `Link "${text}" with href containing "${href}" should not exist within "${parent}".`);
});

/**
 * Assert at least one link has the exact `title` attribute.
 *
 * Example #1: Then the link with the title "Open menu" should exist
 * Example #2: Then the link with the title "Edit profile" should exist
 * Example #3: And the link with the title "Download PDF" should exist
 * Example #4: Then the link with the title "Print page" should exist
 * Example #5: Then the link with the title "Sign in" should exist
 *
 */
Then('the link with the title {string} should exist', async function (title) {
  assert.ok(await this.page.locator(`a[title="${title}"]`).count() > 0, `Link with title "${title}" not found.`);
});

/**
 * Assert NO link has the given exact `title` attribute.
 *
 * Example #1: Then the link with the title "Delete user" should not exist
 * Example #2: Then the link with the title "Open admin" should not exist
 * Example #3: And the link with the title "Edit billing" should not exist
 * Example #4: Then the link with the title "Sign out" should not exist
 * Example #5: Then the link with the title "Reveal secret" should not exist
 *
 */
Then('the link with the title {string} should not exist', async function (title) {
  assert.strictEqual(await this.page.locator(`a[title="${title}"]`).count(), 0, `Link with title "${title}" should not exist.`);
});

/**
 * Assert a link's href is absolute (starts with `http://` or `https://`).
 *
 * Example #1: Then the link "Twitter" should be an absolute link
 * Example #2: Then the link "GitHub" should be an absolute link
 * Example #3: And the link "Documentation" should be an absolute link
 * Example #4: Then the link "Status page" should be an absolute link
 * Example #5: Then the link "External docs" should be an absolute link
 *
 */
Then('the link {string} should be an absolute link', async function (text) {
  const href = await this.page.locator(linkSelector(text)).first().getAttribute('href');
  assert.ok(href && /^https?:\/\//.test(href), `Link "${text}" href "${href}" is not absolute.`);
});

/**
 * Assert a link's href is relative (no `http://` / `https://` scheme).
 *
 * Example #1: Then the link "Home" should not be an absolute link
 * Example #2: Then the link "About" should not be an absolute link
 * Example #3: And the link "Privacy" should not be an absolute link
 * Example #4: Then the link "Pricing" should not be an absolute link
 * Example #5: Then the link "Docs" should not be an absolute link
 *
 */
Then('the link {string} should not be an absolute link', async function (text) {
  const href = await this.page.locator(linkSelector(text)).first().getAttribute('href');
  assert.ok(href && !/^https?:\/\//.test(href), `Link "${text}" href "${href}" should not be absolute.`);
});

/**
 * Click a link addressed by its `title` attribute.
 *
 * Example #1: When I click on the link with the title "Open menu"
 * Example #2: When I click on the link with the title "Edit profile"
 * Example #3: And we click on the link with the title "Download PDF"
 * Example #4: When I click on the link with the title "Print page"
 * Example #5: When I click on the link with the title "Sign in"
 *
 */
When(/^(I |we )*click on the link with the title "([^"]*)"$/, async function (pronoun, title) {
  await this.page.locator(`a[title="${title}"]`).first().click();
});
