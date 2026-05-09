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
  findVisibleModal,
  isAnyModalVisible,
  waitForModalState,
} = require('./webship');

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
 * Example #1: When I click "Confirm" in the modal
 * Example #2: When I click "Cancel" in the modal dialog
 * Example #3: When we click "OK" button in the modal
 * Example #4: And I click "Close" in the modal
 *
 */
When(/^(I |we )*click "([^"]*)?"( button)* in( the)* modal( dialog)*$/, async function (pronounCase, buttonText, buttonCase, theCase, dialogCase) {
  await waitForModalState(this.page, 'visible', 10000, this);
  const modal = await findVisibleModal(this.page, this);
  await modal.locator('button, a, [role="button"], input[type="button"], input[type="submit"], .btn')
    .filter({ hasText: buttonText })
    .first()
    .click();
});

/**
 * Click a CSS-selector-addressed element inside the active modal.
 *
 * Distinct from "click :text in the modal" which uses visible button text.
 * Use this variant when the target lacks readable text (icon button) or
 * when text is ambiguous across multiple buttons in the modal.
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
  await getModalLocator(this.page, this).locator(selector).first().click();
});

/**
 * Close or dismiss a modal dialog (uses close button, or Escape fallback).
 *
 * Example #1: When I close the modal
 * Example #2: When I dismiss the modal dialog
 * Example #3: When we close the modal
 * Example #4: And I dismiss the modal
 *
 */
When(/^(I |we )*(close|dismiss)( the)* modal( dialog)*$/, async function (pronounCase, closeOrDismiss, theCase, dialogCase) {
  await waitForModalState(this.page, 'visible', 10000, this);
  const modal = await findVisibleModal(this.page, this);
  const closeBtn = modal.locator('.close, .modal-close, [data-dismiss="modal"], [aria-label="Close"], .btn-close, button[class*="close"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  } else {
    await modal.press('Escape');
  }
});

// "When I wait for the modal to appear/disappear" is defined in wait.steps.js.
