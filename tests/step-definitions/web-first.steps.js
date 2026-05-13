'use strict';

const { friendly } = require('./webship');

// Web-first assertion steps — each matcher polls the live page until the
// condition holds or the per-step timeout elapses. The assertion IS the
// wait, so no `wait for AJAX` is required between an action and its check.
//
// Pattern (all steps):  "<selector>" should [not] be <state>  [within N seconds]
// Default budget is 5s; override with the trailing "within N seconds" clause.

const { Then, When } = require('@cucumber/cucumber');
const assert = require('assert');

function parseTimeout(secondsStr) {
  const n = secondsStr ? parseInt(secondsStr, 10) : 0;
  return n > 0 ? n * 1000 : 5000;
}

// Poll fn() until it returns truthy, or timeout. fn() returns a value;
// `predicate` decides pass/fail. Returns the last value seen.
async function poll(fn, predicate, timeout, message) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try {
      last = await fn();
      if (predicate(last)) return last;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw friendly(`${message} (last seen: ${typeof last === 'object' ? JSON.stringify(last) : String(last)})`);
}

async function checkState(locator, state) {
  switch (state) {
    case 'visible':  return locator.first().isVisible();
    case 'hidden':   return !(await locator.first().isVisible().catch(() => false));
    case 'attached': return (await locator.count()) > 0;
    case 'focused':  return locator.first().evaluate((el) => el === document.activeElement);
    case 'enabled':  return locator.first().isEnabled();
    case 'disabled': return locator.first().isDisabled();
    case 'editable': return locator.first().isEditable();
  }
  return false;
}

// ---------------------------------------------------------------------------
// State matchers
// ---------------------------------------------------------------------------

/**
 * Auto-retrying state assertion. Polls the live page until the matcher passes
 * or the budget elapses. Default budget 5 s.
 *
 * Example #1: Then "#dashboard" should be visible
 * Example #2: Then ".success-banner" should be visible within 10 seconds
 * Example #3: And "[data-testid=signup-cta]" should be focused
 * Example #4: Then "button.submit" should be enabled
 * Example #5: Then "input#email" should be editable
 *
 */
Then(/^"([^"]*)" should be (visible|hidden|attached|focused|enabled|disabled|editable)(?: within (\d+) seconds?)?$/, async function (selector, state, sec) {
  const loc = this.page.locator(selector);
  await poll(
    () => checkState(loc, state),
    (v) => v === true,
    parseTimeout(sec),
    `Expected "${selector}" to be ${state}`
  );
});

/**
 * Auto-retrying negated state assertion.
 *
 * Example #1: Then "#loading-spinner" should not be visible
 * Example #2: Then ".error" should not be visible within 5 seconds
 * Example #3: And "button.submit" should not be disabled
 * Example #4: Then "input#email" should not be editable
 * Example #5: Then "[data-testid=password]" should not be focused
 *
 */
Then(/^"([^"]*)" should not be (visible|hidden|attached|focused|enabled|disabled|editable)(?: within (\d+) seconds?)?$/, async function (selector, state, sec) {
  const loc = this.page.locator(selector);
  await poll(
    () => checkState(loc, state),
    (v) => v === false,
    parseTimeout(sec),
    `Expected "${selector}" to not be ${state}`
  );
});

/**
 * Assert an element's bounding box overlaps the visible viewport rectangle.
 *
 * Example #1: Then "#hero" should be in the viewport
 * Example #2: Then "[data-testid=cta]" should be in the viewport within 3 seconds
 * Example #3: When I scroll to the element "#footer"
 *               Then "#footer" should be in the viewport
 * Example #4: Then "h1" should be in the viewport
 * Example #5: Then ".banner" should be in the viewport
 *
 */
Then(/^"([^"]*)" should be in the viewport(?: within (\d+) seconds?)?$/, async function (selector, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    async () => loc.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || 0)
          && r.right > 0 && r.left < (window.innerWidth || 0);
    }),
    (v) => v === true,
    parseTimeout(sec),
    `Expected "${selector}" to be in viewport`
  );
});

/**
 * Assert an element is OUTSIDE the visible viewport rectangle.
 *
 * Example #1: Then "#footer" should not be in the viewport
 * Example #2: Then "[data-testid=hidden]" should not be in the viewport within 3 seconds
 * Example #3: And ".off-screen" should not be in the viewport
 * Example #4: Then "section.below-fold" should not be in the viewport
 * Example #5: When I scroll to the top
 *               Then "#footer" should not be in the viewport
 *
 */
Then(/^"([^"]*)" should not be in the viewport(?: within (\d+) seconds?)?$/, async function (selector, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    async () => loc.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || 0)
          && r.right > 0 && r.left < (window.innerWidth || 0);
    }).catch(() => false),
    (v) => v === false,
    parseTimeout(sec),
    `Expected "${selector}" to not be in viewport`
  );
});

/**
 * Assert exactly N elements match a selector (auto-retry).
 *
 * Example #1: Then ".product-card" should have a count of 12
 * Example #2: Then ".error" should have a count of 0 within 5 seconds
 * Example #3: And "tr" should have a count of 21
 * Example #4: Then "[data-testid=item]" should have a count of 5
 * Example #5: Then ".feed-item" should have a count of 25 within 10 seconds
 *
 */
Then(/^"([^"]*)" should have a count of (\d+)(?: within (\d+) seconds?)?$/, async function (selector, count, sec) {
  const expected = parseInt(count, 10);
  const loc = this.page.locator(selector);
  await poll(
    () => loc.count(),
    (v) => v === expected,
    parseTimeout(sec),
    `Expected "${selector}" count to be ${expected}`
  );
});

/**
 * Assert an element's textContent equals an expected string (trimmed).
 *
 * Example #1: Then "h1" should have text "Welcome"
 * Example #2: Then ".badge" should have text "12" within 3 seconds
 * Example #3: And ".total" should have text "$99.00"
 * Example #4: Then "[data-testid=subtitle]" should have text "Premium"
 * Example #5: Then ".alert" should have text "Saved"
 *
 */
Then(/^"([^"]*)" should have text "([^"]*)"(?: within (\d+) seconds?)?$/, async function (selector, text, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    () => loc.textContent(),
    (v) => (v || '').trim() === text,
    parseTimeout(sec),
    `Expected "${selector}" text to be "${text}"`
  );
});

/**
 * Assert an element's textContent contains an expected substring.
 *
 * Example #1: Then "h1" should contain text "Welcome"
 * Example #2: Then ".badge" should contain text "unread" within 3 seconds
 * Example #3: And ".total" should contain text "$99"
 * Example #4: Then "[data-testid=subtitle]" should contain text "Premium"
 * Example #5: Then ".alert" should contain text "Saved"
 *
 */
Then(/^"([^"]*)" should contain text "([^"]*)"(?: within (\d+) seconds?)?$/, async function (selector, text, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    () => loc.textContent(),
    (v) => (v || '').includes(text),
    parseTimeout(sec),
    `Expected "${selector}" to contain text "${text}"`
  );
});

/**
 * Assert an input's `value` property equals an expected string.
 *
 * Example #1: Then "#email" should have value "alice@example.com"
 * Example #2: Then "input[name=q]" should have value "laptops"
 * Example #3: And "[data-testid=phone]" should have value "0790000000"
 * Example #4: Then "#bio" should have value "" within 3 seconds
 * Example #5: Then "select#country" should have value "JO"
 *
 */
Then(/^"([^"]*)" should have value "([^"]*)"(?: within (\d+) seconds?)?$/, async function (selector, value, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    () => loc.inputValue(),
    (v) => v === value,
    parseTimeout(sec),
    `Expected "${selector}" value to be "${value}"`
  );
});

/**
 * Assert an element's attribute equals an expected value.
 *
 * Example #1: Then "#tab-1" should have attribute "aria-selected" with value "true"
 * Example #2: Then "[data-testid=cta]" should have attribute "data-state" with value "open"
 * Example #3: And "img.logo" should have attribute "alt" with value "Webship.co"
 * Example #4: Then "a.signup" should have attribute "href" with value "/signup"
 * Example #5: Then "input#email" should have attribute "type" with value "email"
 *
 */
Then(/^"([^"]*)" should have attribute "([^"]*)" with value "([^"]*)"(?: within (\d+) seconds?)?$/, async function (selector, attr, value, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    () => loc.getAttribute(attr),
    (v) => v === value,
    parseTimeout(sec),
    `Expected "${selector}" attribute "${attr}" to be "${value}"`
  );
});

/**
 * Assert an element's `class` attribute contains a class token.
 *
 * Example #1: Then "#tab-1" should have class "is-active"
 * Example #2: Then ".modal" should have class "show" within 3 seconds
 * Example #3: And ".dropdown" should have class "open"
 * Example #4: Then "tr.row-1" should have class "selected"
 * Example #5: Then "[data-testid=card]" should have class "highlighted"
 *
 */
Then(/^"([^"]*)" should have class "([^"]*)"(?: within (\d+) seconds?)?$/, async function (selector, cls, sec) {
  const loc = this.page.locator(selector).first();
  await poll(
    () => loc.getAttribute('class'),
    (v) => (v || '').split(/\s+/).includes(cls),
    parseTimeout(sec),
    `Expected "${selector}" to have class "${cls}"`
  );
});

/**
 * Click an element by its accessible role + name (Playwright `getByRole`).
 *
 * Example #1: When I click the "Sign in" button
 * Example #2: When I click the "Profile" link
 * Example #3: And we click the "Notifications" tab
 * Example #4: When I click the "Subscribe" checkbox
 * Example #5: When I click the "Premium" radio
 *
 */
When(/^(I |we )*click the "([^"]*)" (button|link|tab|menuitem|checkbox|radio|option)$/, async function (pronoun, name, role) {
  await this.page.getByRole(role, { name }).first().click();
});

/**
 * Assert a role-addressed element is visible (auto-retry).
 *
 * Example #1: Then the "Save changes" button should be visible
 * Example #2: Then the "Profile" link should be visible within 5 seconds
 * Example #3: And the "Privacy" tab should be visible
 * Example #4: Then the "I agree" checkbox should be visible
 * Example #5: Then the "Premium" radio should be visible
 *
 */
Then(/^the "([^"]*)" (button|link|tab|menuitem|checkbox|radio|option) should be visible(?: within (\d+) seconds?)?$/, async function (name, role, sec) {
  const loc = this.page.getByRole(role, { name }).first();
  await poll(
    () => loc.isVisible(),
    (v) => v === true,
    parseTimeout(sec),
    `Expected ${role} "${name}" to be visible`
  );
});
