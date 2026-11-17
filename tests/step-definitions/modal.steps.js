'use strict';

// All modal / dialog step definitions live in this file.
//
// Modal element resolution priority:
//   1. world.__selectorsCss['modal']  (set via the named-selector registry
//      or the active CMS / framework selector preset)
//   2. fallback to "[role=\"dialog\"], dialog"
//
// Visibility is derived from computed style (display, visibility, opacity)
// rather than offsetParent — that check is unreliable for fixed-position
// modal containers. The wait step lives in wait.steps.js.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const {
  getModalLocator,
  getModalSelector,
  findVisibleModal,
  isAnyModalVisible,
  waitForModalState,
  friendly,
  failure,
  isTimeout,
} = require('./webship');

// The controls a modal is acted on through by their text.
const MODAL_CONTROLS = 'button, a, [role="button"], input[type="button"], input[type="submit"], .btn';

/**
 * The modal that is open, waiting up to 5 seconds for one. When none is
 * open, the step fails at once with what it wanted to do, the modal selector
 * it tried and a hint, instead of a long wait and "the page took too long".
 *
 * @param {Object} world
 * @param {string} action - What the step wanted to do in the modal.
 * @returns {Promise<import('playwright').Locator>}
 */
async function openModal(world, action) {
  try {
    await waitForModalState(world.page, 'visible', 5000, world);
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(world.page, 'No modal is open: none was visible after 5 seconds.', {
      hint: `the step wanted to ${action}. Open the modal first, or wait for it: When I wait for the modal to appear. Modals are found with "${getModalSelector(world)}"; register a "modal" CSS selector for other markup.`,
    });
  }
  return findVisibleModal(world.page, world);
}

/**
 * Wait up to 5 seconds for an element of the open modal to be visible; fail
 * plainly, with what the modal offers, when it does not show.
 *
 * @param {Object} world
 * @param {import('playwright').Locator} modal
 * @param {import('playwright').Locator} target
 * @param {string} message - The failure when the element does not show.
 * @param {string} hint
 * @returns {Promise<void>}
 */
async function inModal(world, modal, target, message, hint) {
  try {
    await target.waitFor({ state: 'visible', timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    const names = await modal.locator(MODAL_CONTROLS).evaluateAll((els) => els
      .map((el) => (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)).catch(() => []);
    throw failure(world.page, message, {
      found: names.length ? names.map((n) => `"${n}"`).join(', ') : 'no button or link',
      hint,
    });
  }
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

/**
 * Assert that a modal dialog is visible or not visible on the page.
 *
 * Example #1: Then I should see a modal
 * Example #2: Then I should see the modal
 * Example #3: Then we should see a modal dialog
 * Example #4: Then I should not see a modal
 * Example #5: Then I should not see the modal dialog
 *
 */
Then(/^(I |we )*should( not)* see (a |the )*modal( dialog)*$/, async function (pronounCase, notCase, aTheCase, dialogCase) {
  const visible = await isAnyModalVisible(this.page, this);
  if (notCase) {
    assert.ok(!visible, 'Modal dialog is visible, but it should not be.');
  } else {
    assert.ok(visible, 'Modal dialog is not visible, but it should be.');
  }
});

/**
 * Assert that a modal dialog with a given title is visible or not visible.
 *
 * Example #1: Then I should see a modal with title "Confirm Action"
 * Example #2: Then I should see the modal with title "Welcome"
 * Example #3: Then we should see a modal with title "Welcome Message"
 * Example #4: Then I should not see a modal with title "Error"
 * Example #5: Then I should not see the modal with title "Validation Error"
 *
 */
Then(/^(I |we )*should( not)* see (a |the )*modal with title "([^"]*)?"$/, async function (pronounCase, notCase, aTheCase, title) {
  const modal = getModalLocator(this.page, this);
  const byHeading = modal.locator('.modal-title, .dialog-title, h1, h2, h3').filter({ hasText: title });
  const byAttr = modal.locator(`[title*="${title}"], [aria-label*="${title}"]`);
  const found = await byHeading.count() > 0 || await byAttr.count() > 0;
  if (notCase) {
    assert.ok(!found, `Modal with title "${title}" is visible, but it should not be.`);
  } else {
    assert.ok(found, `Modal with title "${title}" is not visible or not found.`);
  }
});

/**
 * Assert that a specific modal by id/class/data-modal is visible or not.
 *
 * Example #1: Then I should see a "confirmation-modal" modal
 * Example #2: Then I should see the "#delete-modal" modal
 * Example #3: Then we should see a "settings-modal" modal
 * Example #4: Then I should not see a "error-modal" modal
 * Example #5: Then I should not see the "#success-modal" modal
 *
 */
Then(/^(I |we )*should( not)* see (a |the )*"([^"]*)?" modal$/, async function (pronounCase, notCase, aTheCase, identifier) {
  const selector = (identifier.startsWith('#') || identifier.startsWith('.'))
    ? identifier
    : `#${identifier}, .${identifier}, [data-modal="${identifier}"]`;
  const visible = await this.page.locator(selector).first().isVisible();
  if (notCase) {
    assert.ok(!visible, `Modal "${identifier}" is visible, but it should not be.`);
  } else {
    assert.ok(visible, `Modal "${identifier}" is not visible or not found.`);
  }
});

// ---------------------------------------------------------------------------
// Text content
// ---------------------------------------------------------------------------

/**
 * Assert that a modal contains or does not contain specific text.
 *
 * Example #1: Then I should see "Are you sure?" in the modal
 * Example #2: Then I should see "Delete this item" in the modal
 * Example #3: Then we should see "Confirmation required" in the modal dialog
 * Example #4: Then I should not see "Error occurred" in the modal
 * Example #5: Then we should not see "Loading" in the modal dialog
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* modal( dialog)*$/, async function (pronounCase, notCase, expectedText, theCase, dialogCase) {
  const found = await getModalLocator(this.page, this).filter({ hasText: expectedText }).count() > 0;
  if (notCase) {
    assert.ok(!found, `Found "${expectedText}" in modal, but it should not be there.`);
  } else {
    assert.ok(found, `Could not find "${expectedText}" in modal.`);
  }
});

/**
 * Assert that the modal contains the given text (alternate phrasing).
 *
 * Distinct from "I should see :text in the modal" — checks plain
 * `innerText`, ignoring nested layout. Use when the text is part of the
 * modal body rather than a specific element.
 *
 * Example #1: Then the modal should contain "Welcome modal text"
 * Example #2: Then the modal should contain "Are you sure"
 * Example #3: And the modal should contain "Order #1234"
 * Example #4: When I press "Show details"
 *               Then the modal should contain "Address"
 * Example #5: Given I am on "/dashboard"
 *               When I click "Open settings"
 *               And I wait for the modal to appear
 *               Then the modal should contain "Preferences"
 *
 */
Then('the modal should contain {string}', async function (text) {
  const inner = await getModalLocator(this.page, this).first().innerText();
  assert.ok(inner.indexOf(text) !== -1, `Modal does not contain "${text}". Got: ${inner}`);
});

/**
 * Assert that the modal does NOT contain the given text.
 *
 * Passes when no modal exists OR when the modal exists but lacks the text.
 *
 * Example #1: Then the modal should not contain "Goodbye"
 * Example #2: Then the modal should not contain "Error"
 * Example #3: And the modal should not contain "Payment failed"
 * Example #4: When I close the modal
 *               Then the modal should not contain "Welcome"
 * Example #5: When I press "Refresh"
 *               Then the modal should not contain "Loading"
 *
 */
Then('the modal should not contain {string}', async function (text) {
  const loc = getModalLocator(this.page, this);
  const count = await loc.count();
  if (count === 0) return;
  const inner = await loc.first().innerText();
  assert.ok(inner.indexOf(text) === -1, `Modal should not contain "${text}".`);
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

/**
 * Click a button or link inside a modal dialog by its visible text.
 *
 * Waits up to 5 seconds for a modal to be open; when none is, the step fails
 * with "No modal is open". A button or link the open modal does not have
 * fails within 5 seconds, listing the ones it has.
 *
 * Example #1: When I click "Confirm" in the modal
 * Example #2: When I click "Cancel" in the modal dialog
 * Example #3: When we click "OK" button in the modal
 * Example #4: And I click "Close" in the modal
 * Example #5: When we click "Save changes" in the modal dialog
 *
 */
When(/^(I |we )*click "([^"]*)?"( button)* in( the)* modal( dialog)*$/, async function (pronounCase, buttonText, buttonCase, theCase, dialogCase) {
  const modal = await openModal(this, `click "${buttonText}" in it`);
  const target = modal.locator(MODAL_CONTROLS).filter({ hasText: buttonText }).first();
  await inModal(this, modal, target, `The open modal has no button or link "${buttonText}".`,
    'name the button by its visible text. For a button without text, use: I click on "<selector>" in the modal');
  try {
    await target.click({ timeout: 5000 });
  } catch (e) {
    throw friendly({
      action: `click "${buttonText}" in the modal`,
      cause: e,
      hint: 'the button is in the open modal but could not be clicked; another element may cover it.',
    });
  }
});

/**
 * Click a CSS-selector-addressed element inside the active modal.
 *
 * Distinct from "click :text in the modal" which uses visible button text.
 * Use this variant when the target lacks readable text (icon button) or
 * when text is ambiguous across multiple buttons in the modal. The selector
 * is looked for inside the open modal only; when no modal is open within 5
 * seconds, the step fails with "No modal is open".
 *
 * Example #1: When I click on "#close-btn" in the modal
 * Example #2: When I click on ".confirm-delete" in the modal
 * Example #3: And I click on "[data-testid=accept]" in the modal
 * Example #4: When I click on "button[aria-label=Close]" in the modal
 * Example #5: When I press "Open settings"
 *               And I wait for the modal to appear
 *               Then I click on "#tab-notifications" in the modal
 *
 */
When(/^(I |we )*click on "([^"]*)" in the modal$/, async function (pronoun, selector) {
  const modal = await openModal(this, `click on "${selector}" in it`);
  const target = modal.locator(selector).first();
  await inModal(this, modal, target, `The open modal has no visible element "${selector}".`,
    'the selector is looked for inside the open modal only; to click by visible text, use: I click "<text>" in the modal');
  try {
    await target.click({ timeout: 5000 });
  } catch (e) {
    throw friendly({
      action: `click on "${selector}" in the modal`,
      cause: e,
      hint: 'the element is in the open modal but could not be clicked; another element may cover it.',
    });
  }
});

/**
 * Close or dismiss a modal dialog (uses close button, or Escape fallback).
 * When no modal is open within 5 seconds, the step fails with "No modal is
 * open".
 *
 * Example #1: When I close the modal
 * Example #2: When I dismiss the modal dialog
 * Example #3: When we close the modal
 * Example #4: And I dismiss the modal
 * Example #5: When we dismiss the modal dialog
 *
 */
When(/^(I |we )*(close|dismiss)( the)* modal( dialog)*$/, async function (pronounCase, closeOrDismiss, theCase, dialogCase) {
  const modal = await openModal(this, `${closeOrDismiss} it`);
  try {
    const closeBtn = modal.locator('.close, .modal-close, [data-dismiss="modal"], [aria-label="Close"], .btn-close, button[class*="close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ timeout: 5000 });
    } else {
      await modal.press('Escape');
    }
  } catch (e) {
    throw friendly({
      action: `${closeOrDismiss} the modal`,
      cause: e,
      hint: `the modal had no recognised close button; check it is open or register a custom close-button selector.`,
    });
  }
});

// "When I wait for the modal to appear/disappear" is defined in wait.steps.js.
