'use strict';

const { friendly } = require('./webship');

// Authentication-state helpers built on Playwright's `storageState` API.
//
// Save the cookies + localStorage of an authenticated context to a JSON file
// once, then restore that snapshot in later scenarios so each test does not
// have to walk through the login UI. This is the single biggest speedup
// available for suites that touch authenticated pages — typical savings of
// 1-3 seconds per scenario.
//
// Recommended layout:
//
//   tests/auth/admin.json
//   tests/auth/editor.json
//   tests/auth/customer.json
//
// Recommended setup feature: tag a one-shot scenario `@auth-setup`, run it
// once via `npx cucumber-js --tags @auth-setup` after every credential
// rotation, and let everyday scenarios restore the snapshot.

const { Given, When } = require('@cucumber/cucumber');
const path = require('path');
const fs = require('fs');

function resolveStoragePath(p) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * Save the current browser context's cookies + localStorage to a JSON file.
 *
 * Run this AFTER a successful interactive login. The destination file is
 * created (with parent directories) if it does not exist; existing files are
 * overwritten.
 *
 * Example #1: When I save the auth state to "tests/auth/admin.json"
 * Example #2: Given I am on "/login"
 *               When I fill in "admin@example.com" for "Email"
 *               And I fill in "secret" for "Password"
 *               And I press "Sign in"
 *               And I wait until the URL contains "/dashboard"
 *               Then I save the auth state to "tests/auth/admin.json"
 * Example #3: When I save the auth state to "tests/auth/editor.json"
 * Example #4: When we save the auth state to "tests/auth/customer.json"
 * Example #5: When I save the auth state to "/tmp/admin-state.json"
 *
 */
When(/^(I |we )*save the auth state to "([^"]*)"$/, async function (pronoun, target) {
  const file = resolveStoragePath(target);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await this.context.storageState({ path: file });
});

/**
 * Restore cookies + localStorage from a previously saved JSON file.
 *
 * The current browser context is closed and a fresh one is opened with the
 * saved state. The webship-js init script (AJAX/timer/mutation tracker) is
 * re-installed automatically so smart waits keep working. Subsequent steps
 * proceed against the restored, authenticated session.
 *
 * Example #1: Given I restore the auth state from "tests/auth/admin.json"
 * Example #2: Given I restore the auth state from "tests/auth/editor.json"
 *               And I am on "/admin/products"
 * Example #3: Given I restore the auth state from "tests/auth/customer.json"
 *               And I am on "/account/orders"
 * Example #4: Given we restore the auth state from "tests/auth/admin.json"
 * Example #5: Given I restore the auth state from "tests/auth/admin.json"
 *               And I am on "/dashboard"
 *               Then "<#user-list>" should have a count of 5 within 5 seconds
 *
 */
Given(/^(I |we )*restore the auth state from "([^"]*)"$/, async function (pronoun, source) {
  const file = resolveStoragePath(source);
  if (!fs.existsSync(file)) {
    throw friendly(`Auth state file not found: ${file}`);
  }
  const playwrightConfig = require(path.join(process.cwd(), 'playwright.config'));
  const newContext = await this.playwrightBrowser.newContext({
    ...playwrightConfig.contextOptions,
    storageState: file,
  });
  await newContext.addInitScript(() => {
    if (window.__webshipAjaxInstalled) return;
    window.__webshipAjaxInstalled = true;
    window.__webshipAjaxCount = 0;
    window.__webshipPendingTimers = 0;
    window.__webshipLastMutation = Date.now();
  });
  if (this.context) await this.context.close();
  this.context = newContext;
  this.page = await this.context.newPage();
});

/**
 * Clear cookies and localStorage / sessionStorage for the current context.
 *
 * Use to anonymize a session mid-scenario, e.g. after asserting a logged-in
 * action you may want to verify the same path returns 302 / login form for
 * an anonymous visitor.
 *
 * Example #1: Given I clear the auth state
 * Example #2: Given I restore the auth state from "tests/auth/admin.json"
 *               And I am on "/dashboard"
 *               Given I clear the auth state
 *               When I am on "/dashboard"
 *               Then I should see "Sign in"
 * Example #3: Given we clear the auth state
 * Example #4: When I press "Logout"
 *               And I clear the auth state
 * Example #5: Given I clear the auth state
 *               When I am on the homepage
 *               Then I should see "Login"
 *
 */
Given(/^(I |we )*clear the auth state$/, async function () {
  await this.context.clearCookies();
  try {
    await this.page.evaluate(() => {
      try { localStorage.clear(); } catch { /* no-op */ }
      try { sessionStorage.clear(); } catch { /* no-op */ }
    });
  } catch { /* page may not be on a real URL yet */ }
});
