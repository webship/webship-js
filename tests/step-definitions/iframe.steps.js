'use strict';

const { friendly } = require('./webship');

// Iframe / frame steps backed by Playwright's `frameLocator` API.
//
// Frames are addressed by CSS selector. Once switched, frame-scoped
// interaction steps target the chosen frame instead of the main document.
// Switch back with "I switch to the root document".

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

function frameRoot(world) {
  return world.frame || world.page;
}

function explain(action, detail, e) {
  return friendly({
    action,
    cause: e,
    hint: `wait for the iframe to load first ("When I wait for \\"iframe\\" to appear"). Detail: ${detail}.`,
  });
}

/**
 * Switch the active scope to an iframe addressed by CSS selector.
 *
 * Example #1: When I switch to iframe "iframe.payment"
 * Example #2: When I switch to the iframe "#stripe-frame"
 * Example #3: And we switch to iframe "iframe[name=widget]"
 * Example #4: When I switch to iframe ".captcha-frame"
 * Example #5: When I switch to the iframe "iframe[src*=embed]"
 *
 */
When(/^(I |we )*switch to (the )?iframe "([^"]*)"$/, async function (pronoun, theCase, sel) {
  try {
    if (!this._rootPage) this._rootPage = this.page;
    this.frame = this.page.frameLocator(sel);
  } catch (e) {
    throw explain(`switch to iframe "${sel}"`, `selector tried: ${sel}`, e);
  }
});

/**
 * Switch the active scope to an iframe by Playwright frame-locator string.
 *
 * Example #1: When I switch to iframe with locator "iframe.payment"
 * Example #2: When I switch to iframe with locator "#stripe-frame"
 * Example #3: And I switch to iframe with locator "iframe[name=widget]"
 * Example #4: When I switch to iframe with locator ".captcha-frame"
 * Example #5: When I switch to iframe with locator "iframe[src*=embed]"
 *
 */
When(/^(I |we )*switch to iframe with locator "([^"]*)"$/, async function (pronoun, sel) {
  try {
    if (!this._rootPage) this._rootPage = this.page;
    this.frame = this.page.frameLocator(sel);
  } catch (e) {
    throw explain(`switch to iframe with locator "${sel}"`, `locator: ${sel}`, e);
  }
});

/**
 * Return the active scope to the top document (clear the iframe scope).
 *
 * Example #1: When I switch to the root document
 * Example #2: When I switch to iframe ".captcha"
 *               And I click "I am not a robot" inside the iframe
 *               And I switch to the root document
 * Example #3: And we switch to the root document
 * Example #4: When I switch to iframe "#payment"
 *               And I press "Pay"
 *               And I switch to the root document
 *               Then I should see "Payment received"
 * Example #5: When I switch to the root document
 *               And I press "Refresh"
 *
 */
When(/^(I |we )*switch to the root document$/, async function () {
  this.frame = null;
});

/**
 * Switch the active scope to an iframe by its `title` attribute.
 *
 * Example #1: When I switch to the iframe with title "Payment"
 * Example #2: When I switch to the iframe with title "Captcha"
 * Example #3: And we switch to the iframe with title "Widget"
 * Example #4: When I switch to the iframe with title "Embedded video"
 * Example #5: When I switch to the iframe with title "Stripe checkout"
 *
 */
When(/^(I |we )*switch to the iframe with title "([^"]*)"$/, async function (pronoun, title) {
  try {
    if (!this._rootPage) this._rootPage = this.page;
    this.frame = this.page.frameLocator(`iframe[title="${title}"]`);
  } catch (e) {
    throw explain(`switch to iframe by title "${title}"`, `selector: iframe[title="${title}"]`, e);
  }
});

/**
 * Switch the active scope to an iframe by its `name` attribute.
 *
 * Example #1: When I switch to the iframe with name "payment"
 * Example #2: When I switch to the iframe with name "captcha"
 * Example #3: And we switch to the iframe with name "widget"
 * Example #4: When I switch to the iframe with name "embed"
 * Example #5: When I switch to the iframe with name "stripe"
 *
 */
When(/^(I |we )*switch to the iframe with name "([^"]*)"$/, async function (pronoun, name) {
  try {
    if (!this._rootPage) this._rootPage = this.page;
    this.frame = this.page.frameLocator(`iframe[name="${name}"]`);
  } catch (e) {
    throw explain(`switch to iframe by name "${name}"`, `selector: iframe[name="${name}"]`, e);
  }
});

// ---------------------------------------------------------------------------
// Frame-scoped click + fill + assertions
// ---------------------------------------------------------------------------

/**
 * Click visible text inside the active iframe.
 *
 * Example #1: When I click "Confirm" inside the iframe
 * Example #2: When I click "Cancel" inside the iframe
 * Example #3: And we click "Continue" inside the iframe
 * Example #4: When I click "OK" inside the iframe
 * Example #5: When I click "Close" inside the iframe
 *
 */
When(/^(I |we )*click "([^"]*)" inside the iframe$/, async function (pronoun, text) {
  try {
    const root = frameRoot(this);
    if (!root.locator) throw friendly('No active iframe. Switch first.');
    await root.locator(`text="${text}"`).first().click();
  } catch (e) {
    throw friendly({
      action: `click "${text}" inside the iframe`,
      cause: e,
      hint: `switch to the iframe first ("When I switch to iframe '<selector>'"), then check the visible text matches exactly.`,
    });
  }
});

/**
 * Click an attribute-addressed element inside the active iframe.
 *
 * Tries id, class, name, and data-testid in that order.
 *
 * Example #1: When I click "submit-btn" by attr inside the iframe
 * Example #2: When I click "cancel" by attr inside the iframe
 * Example #3: And we click "continue" by attr inside the iframe
 * Example #4: When I click "close" by attr inside the iframe
 * Example #5: When I click "primary-cta" by attr inside the iframe
 *
 */
When(/^(I |we )*click "([^"]*)" by attr inside the iframe$/, async function (pronoun, attrValue) {
  try {
    const root = frameRoot(this);
    await root.locator(`#${attrValue}, .${attrValue}, [name="${attrValue}"], [data-testid="${attrValue}"]`).first().click();
  } catch (e) {
    throw friendly({
      action: `click "${attrValue}" by attribute inside the iframe`,
      cause: e,
      hint: `switch to the iframe first; checked id, class, [name], [data-testid] — none matched.`,
    });
  }
});

/**
 * Fill a field inside the active iframe by `[name]` or id.
 *
 * Example #1: When I fill in "card_number" with "4242 4242 4242 4242" inside the iframe
 * Example #2: When I fill in "cvv" with "123" inside the iframe
 * Example #3: And we fill in "exp_date" with "12/30" inside the iframe
 * Example #4: When I fill in "email" with "alice@example.com" inside the iframe
 * Example #5: When I fill in "name" with "Alice" inside the iframe
 *
 */
When(/^(I |we )*fill in "([^"]*)" with "([^"]*)" inside the iframe$/, async function (pronoun, field, value) {
  try {
    const root = frameRoot(this);
    await root.locator(`[name="${field}"], #${field}`).first().fill(value);
  } catch (e) {
    throw friendly({
      action: `fill "${field}" inside the iframe`,
      cause: e,
      hint: `switch to the iframe first; checked [name] and id — neither matched.`,
    });
  }
});

/**
 * Assert visible text exists inside the active iframe.
 *
 * Example #1: Then I should see "Payment received" inside the iframe
 * Example #2: Then I should see "Welcome" inside the iframe
 * Example #3: And I should see "Confirmed" inside the iframe
 * Example #4: Then I should see "Email verified" inside the iframe
 * Example #5: Then I should see "Subscribed" inside the iframe
 *
 */
Then(/^I should see "([^"]*)" inside the iframe$/, async function (text) {
  const root = frameRoot(this);
  const count = await root.locator(`text="${text}"`).count();
  assert.ok(count > 0, `Expected to see "${text}" inside the iframe.`);
});

/**
 * Assert visible text does NOT exist inside the active iframe.
 *
 * Example #1: Then I should not see "Error" inside the iframe
 * Example #2: Then I should not see "Declined" inside the iframe
 * Example #3: And I should not see "Loading" inside the iframe
 * Example #4: Then I should not see "Pending" inside the iframe
 * Example #5: Then I should not see "Try again" inside the iframe
 *
 */
Then(/^I should not see "([^"]*)" inside the iframe$/, async function (text) {
  const root = frameRoot(this);
  const count = await root.locator(`text="${text}"`).count();
  assert.strictEqual(count, 0, `Expected NOT to see "${text}" inside the iframe.`);
});
