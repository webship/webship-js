'use strict';

// Browser dialog handlers (alert / confirm / prompt / beforeunload).
// Mirrors Playwright's `page.on('dialog')` API with BDD-friendly phrasing.
//
// Attach a handler BEFORE the action that triggers the dialog. Handlers
// queue dialog messages onto `this._lastDialog` so assertions can inspect
// them after the action completes.

const { Given, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Single shared attach() — handles single-shot ("next") and persistent
// ("all") variants via the `once` flag.
function attach(world, action, promptInput, once) {
  if (world._dialogHandler) {
    try { world.page.off('dialog', world._dialogHandler); } catch { /* ignore */ }
  }
  world._lastDialog = null;
  world._dialogHandler = async (dialog) => {
    world._lastDialog = {
      type: dialog.type(),
      message: dialog.message(),
      defaultValue: dialog.defaultValue(),
    };
    try {
      if (action === 'accept') {
        if (typeof promptInput === 'string' && dialog.type() === 'prompt') {
          await dialog.accept(promptInput);
        } else {
          await dialog.accept();
        }
      } else {
        await dialog.dismiss();
      }
    } catch { /* dialog may have closed already */ }
    if (once) {
      try { world.page.off('dialog', world._dialogHandler); } catch { /* ignore */ }
      world._dialogHandler = null;
    }
  };
  world.page.on('dialog', world._dialogHandler);
}

/**
 * Auto-accept the next native browser dialog (alert / confirm / prompt).
 *
 * Example #1: Given I will accept the next dialog
 *               When I click "Delete"
 * Example #2: Given we will accept the next dialog
 *               When I press "Confirm"
 * Example #3: Given I will accept the next dialog
 *               When I click "Save changes"
 *               Then I should see "Saved"
 * Example #4: Given I will accept the next dialog
 *               When I follow "Leave page"
 * Example #5: Given I will accept the next dialog
 *               When I press "Reset password"
 *               Then the last dialog type should be "confirm"
 *
 */
Given(/^(I |we )*will accept the next dialog$/, function () {
  attach(this, 'accept', undefined, true);
});

/**
 * Auto-dismiss the next native browser dialog.
 *
 * Example #1: Given I will dismiss the next dialog
 *               When I click "Leave page"
 * Example #2: Given we will dismiss the next dialog
 *               When I press "Cancel reset"
 * Example #3: Given I will dismiss the next dialog
 *               When I follow "Other site"
 *               Then I should be on the homepage
 * Example #4: Given I will dismiss the next dialog
 *               When I press "Delete"
 *               Then "<.row>" should still be visible
 * Example #5: Given I will dismiss the next dialog
 *               When I close the tab
 *
 */
Given(/^(I |we )*will dismiss the next dialog$/, function () {
  attach(this, 'dismiss', undefined, true);
});

/**
 * Auto-accept the next prompt with the supplied text input.
 *
 * Example #1: Given I will accept the next dialog with "alice@example.com"
 *               When I press "Reset password"
 * Example #2: Given I will accept the next dialog with "Yes"
 *               When I click "Continue"
 * Example #3: Given we will accept the next dialog with "Bug report"
 *               When I press "Open feedback prompt"
 * Example #4: Given I will accept the next dialog with "12345"
 *               When I follow "Set order ID"
 * Example #5: Given I will accept the next dialog with "https://example.com"
 *               When I press "Add link"
 *
 */
Given(/^(I |we )*will accept the next dialog with "([^"]*)"$/, function (pronoun, input) {
  attach(this, 'accept', input, true);
});

/**
 * Assert the most recently captured dialog message equals an expected value.
 *
 * Example #1: Then the last dialog message should be "Are you sure?"
 * Example #2: Then the last dialog message should be "Delete this item?"
 * Example #3: And the last dialog message should be "Leave site?"
 * Example #4: Then the last dialog message should be "Save changes?"
 * Example #5: When I press "Reset"
 *               Then the last dialog message should be "Reset all settings?"
 *
 */
Then(/^the last dialog message should be "([^"]*)"$/, function (text) {
  assert.ok(this._lastDialog, 'No dialog has been captured.');
  assert.strictEqual(this._lastDialog.message, text,
    `Expected dialog message "${text}", got "${this._lastDialog.message}".`);
});

/**
 * Assert the most recently captured dialog message contains an expected substring.
 *
 * Example #1: Then the last dialog message should contain "Are you sure"
 * Example #2: Then the last dialog message should contain "delete"
 * Example #3: And the last dialog message should contain "leave"
 * Example #4: Then the last dialog message should contain "save"
 * Example #5: When I click "Cancel order"
 *               Then the last dialog message should contain "cancel"
 *
 */
Then(/^the last dialog message should contain "([^"]*)"$/, function (text) {
  assert.ok(this._lastDialog, 'No dialog has been captured.');
  assert.ok(this._lastDialog.message.includes(text),
    `Dialog message "${this._lastDialog.message}" does not contain "${text}".`);
});

/**
 * Assert the most recently captured dialog type matches one of `alert`,
 * `confirm`, `prompt`, or `beforeunload`.
 *
 * Example #1: Then the last dialog type should be "confirm"
 * Example #2: Then the last dialog type should be "alert"
 * Example #3: And the last dialog type should be "prompt"
 * Example #4: Then the last dialog type should be "beforeunload"
 * Example #5: When I press "Reset password"
 *               Then the last dialog type should be "prompt"
 *
 */
Then(/^the last dialog type should be "([^"]*)"$/, function (type) {
  assert.ok(this._lastDialog, 'No dialog has been captured.');
  assert.strictEqual(this._lastDialog.type, type,
    `Expected dialog type "${type}", got "${this._lastDialog.type}".`);
});

/**
 * Auto-accept EVERY native browser dialog raised in this scenario.
 *
 * Persistent variant of "I will accept the next dialog" — handler stays
 * attached for the rest of the scenario.
 *
 * Example #1: Given I accept all confirmation dialogs
 * Example #2: Given we accept all confirmation dialogs
 *               When I click "Delete all"
 * Example #3: And I accept all confirmation dialogs
 * Example #4: Given I accept all confirmation dialogs
 *               When I press "Reset settings"
 * Example #5: Given I accept all confirmation dialogs
 *               When I follow "Discard changes"
 *
 */
Given(/^(I |we )*accept all confirmation dialogs$/, function () {
  attach(this, 'accept', undefined, false);
});

/**
 * Auto-dismiss EVERY native browser dialog raised in this scenario.
 *
 * Example #1: Given I do not accept any confirmation dialogs
 * Example #2: Given we do not accept any confirmation dialogs
 *               When I click "Delete"
 * Example #3: And I do not accept any confirmation dialogs
 * Example #4: Given I do not accept any confirmation dialogs
 *               When I press "Cancel reset"
 * Example #5: Given I do not accept any confirmation dialogs
 *               When I follow "Leave page"
 *
 */
Given(/^(I |we )*do not accept any confirmation dialogs$/, function () {
  attach(this, 'dismiss', undefined, false);
});
