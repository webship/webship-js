'use strict';

const { friendly, failure, isTimeout, buildSelector, fillLocator, pageTextLocator } = require('./webship');

// Iframe / frame steps backed by Playwright's `frameLocator` API.
//
// Frames are addressed by CSS selector. Once switched, frame-scoped
// interaction steps target the chosen frame instead of the main document.
// While an iframe is active, a switch looks for the iframe inside it first,
// then in the page, so a scenario can go into a nested iframe or across to
// another iframe of the page. Switch back with "I switch to the root document".

const { When, Then } = require('@cucumber/cucumber');

function frameRoot(world) {
  return world.frame || world.page;
}

/**
 * Make the iframe that `sel` names the active scope. While an iframe is
 * active, an iframe inside it that matches is taken first, else one of the
 * page; both are looked for during up to 5 seconds while the frames load.
 * When neither shows, the iframe of the page is kept, and the next step that
 * acts in it says what is missing.
 *
 * @param {Object} world
 * @param {string} sel - CSS selector of the iframe element.
 */
async function switchToFrame(world, sel) {
  if (!world._rootPage) world._rootPage = world.page;
  const fromPage = world.page.frameLocator(sel);
  if (world.frame) {
    const nested = world.frame.locator(sel);
    const top = world.page.locator(sel);
    const deadline = Date.now() + 5000;
    for (;;) {
      if (await nested.count().catch(() => 0)) {
        world.frame = world.frame.frameLocator(sel);
        return;
      }
      if (await top.count().catch(() => 0)) break;
      if (Date.now() >= deadline) break;
      await world.page.waitForTimeout(100);
    }
  }
  world.frame = fromPage;
}

function noFrameHint(world) {
  return world.frame
    ? 'The step reads the iframe the scenario switched to last; switch to another one first if the text is there.'
    : 'No iframe is active, so the step read the page: switch to the iframe first (When I switch to iframe "<selector>").';
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
    await switchToFrame(this, sel);
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
    await switchToFrame(this, sel);
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
When(/^(I |we )*switch to the root document$/, async function (pronoun) {
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
    await switchToFrame(this, `iframe[title="${title}"]`);
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
    await switchToFrame(this, `iframe[name="${name}"]`);
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
 * Tries the same attributes as `I click "…" by attr` on the page: id, class,
 * name, data-testid, data-test-id, data-test, data-cy, aria-label, value,
 * placeholder and title (a text with a space: value, placeholder,
 * aria-label and title); a text that starts with #, . or [ is a CSS selector.
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
    await root.locator(buildSelector(attrValue)).first().click();
  } catch (e) {
    throw friendly({
      action: `click "${attrValue}" by attribute inside the iframe`,
      cause: e,
      hint: `switch to the iframe first; checked id, class, name, the test ids, aria-label, value, placeholder and title — none matched.`,
    });
  }
});

/**
 * Fill a field inside the active iframe, found by the exact text of its
 * label, by its placeholder, by its name or by its id, like the fill step of
 * the page. A field that is not found within 5 seconds, or that is hidden,
 * disabled or read-only, fails the step with what is wrong.
 *
 * Example #1: When I fill in "card_number" with "4242 4242 4242 4242" inside the iframe
 * Example #2: When I fill in "cvv" with "123" inside the iframe
 * Example #3: And we fill in "exp_date" with "12/30" inside the iframe
 * Example #4: When I fill in "email" with "alice@example.com" inside the iframe
 * Example #5: When I fill in "name" with "Alice" inside the iframe
 * Example #6: When I fill in "Coupon code" with "SAVE10" inside the iframe
 *
 */
When(/^(I |we )*fill in "([^"]*)" with "([^"]*)" inside the iframe$/, async function (pronoun, field, value) {
  const root = frameRoot(this);
  const q = field.replace(/["\\]/g, '\\$&');
  const loc = root.getByLabel(field, { exact: true })
    .or(root.getByPlaceholder(field, { exact: true }))
    .or(root.locator(`[name="${q}"]`))
    .or(root.locator(`[id="${q}"]`))
    .first();
  try {
    await loc.waitFor({ state: 'attached', timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No field with the label, the placeholder, the name or the id "${field}" was found inside the iframe after 5 seconds.`, {
      hint: `name the field by the exact text of its label, its placeholder, its name or its id. ${noFrameHint(this)}`,
    });
  }
  await fillLocator(this.page, loc, value, field);
});

/**
 * Assert a text is inside the active iframe. The iframe's text is read the
 * way `I should see` reads the page: letter case ignored, white space
 * collapsed, a text inside an element as well as its whole text, the text of
 * hidden elements included. Waits up to 5 seconds for the text to come.
 *
 * Example #1: Then I should see "Payment received" inside the iframe
 * Example #2: Then I should see "Welcome" inside the iframe
 * Example #3: And I should see "Confirmed" inside the iframe
 * Example #4: Then I should see "Email verified" inside the iframe
 * Example #5: Then I should see "Subscribed" inside the iframe
 *
 */
Then(/^I should see "([^"]*)" inside the iframe$/, async function (text) {
  try {
    await pageTextLocator(frameRoot(this), text).waitFor({ state: 'attached', timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The text "${text}" was not found inside the iframe after 5 seconds.`, {
      hint: `check the spelling; letter case is ignored. ${noFrameHint(this)}`,
    });
  }
});

/**
 * Assert a text is NOT inside the active iframe, read as `I should see
 * "…" inside the iframe` reads it. Waits up to 5 seconds for the text to go.
 *
 * Example #1: Then I should not see "Error" inside the iframe
 * Example #2: Then I should not see "Declined" inside the iframe
 * Example #3: And I should not see "Loading" inside the iframe
 * Example #4: Then I should not see "Pending" inside the iframe
 * Example #5: Then I should not see "Try again" inside the iframe
 *
 */
Then(/^I should not see "([^"]*)" inside the iframe$/, async function (text) {
  try {
    await pageTextLocator(frameRoot(this), text).waitFor({ state: 'detached', timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The text "${text}" is inside the iframe, but it should not be.`, {
      hint: `the step ignores letter case and reads all the text of the iframe, the text of hidden elements included; it waited 5 seconds for the text to go. ${noFrameHint(this)}`,
    });
  }
});
