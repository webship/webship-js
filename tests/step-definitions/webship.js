'use strict';

const { setWorldConstructor, World, Before, After, BeforeStep, AfterStep, setDefaultTimeout, Given, When, Then } = require('@cucumber/cucumber');
const playwright = require('playwright');
const playwrightConfig = require(require('path').join(process.cwd(), 'playwright.config'));
const assert = require('assert');
const axios = require('axios');
const path = require('path');

// ---------------------------------------------------------------------------
// Auto HTML report on cucumber-js process exit.
// Disable: WEBSHIP_REPORT_DISABLE=1. Extra flags: WEBSHIP_REPORT_ARGS="--theme hierarchy --layout 2".
// Registered once per process.
// ---------------------------------------------------------------------------
if (!global.__WEBSHIP_AUTO_REPORT__) {
  global.__WEBSHIP_AUTO_REPORT__ = true;
  process.on('exit', () => {
    if (process.env.WEBSHIP_REPORT_DISABLE) return;
    try {
      const { run } = require(path.join(__dirname, '..', '..', 'bin', 'generate-reports'));
      const extra = (process.env.WEBSHIP_REPORT_ARGS || '').split(/\s+/).filter(Boolean);
      run(extra);
    } catch (err) {
      console.error('[webship-js] Report generation failed:', err.message);
    }
  });
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------
setDefaultTimeout(30 * 1000);

class PlaywrightWorld extends World {
  constructor(options) {
    super(options);
    this.launchUrl = this.parameters.launchUrl;
    this.minWaitTime = this.parameters.minWaitTime;
    this.playwrightBrowser = null;
    this.context = null;
    this.page = null;
    this.assetsFolder = path.join(__dirname, '../assets/');
  }

  async openBrowser() {
    const { browser: browserName, launchOptions, contextOptions } = playwrightConfig;
    this.playwrightBrowser = await playwright[browserName].launch(launchOptions);
    this.context = await this.playwrightBrowser.newContext(contextOptions);
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    if (this.playwrightBrowser) {
      await this.playwrightBrowser.close();
      this.playwrightBrowser = null;
      this.context = null;
      this.page = null;
    }
  }
}

setWorldConstructor(PlaywrightWorld);

Before(async function () {
  await this.openBrowser();
  if (this.minWaitTime.before_scenario > 0) {
    await this.page.waitForTimeout(this.minWaitTime.before_scenario);
  }
});

After(async function () {
  if (this.minWaitTime.after_scenario > 0) {
    await this.page.waitForTimeout(this.minWaitTime.after_scenario);
  }
  await this.closeBrowser();
});

BeforeStep(async function () {
  if (this.page && this.minWaitTime.before_step > 0) {
    await this.page.waitForTimeout(this.minWaitTime.before_step);
  }
});

AfterStep(async function () {
  if (this.page && this.minWaitTime.after_step > 0) {
    await this.page.waitForTimeout(this.minWaitTime.after_step);
  }
});

// ---------------------------------------------------------------------------
// Helper: build CSS selector from attrValue + optional attr argument.
// ---------------------------------------------------------------------------
function buildSelector(attrValue, attr) {
  const hasASpace = attrValue.indexOf(' ');
  if ((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace === -1) {
    return attrValue;
  }
  if (!attr && hasASpace === -1) {
    return (
      attrValue +
      ',#' + attrValue +
      ',.' + attrValue +
      ',[name=' + attrValue + '],' +
      '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]' +
      ',[title="' + attrValue + '"]'
    );
  }
  if (!attr && hasASpace > -1) {
    return '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  return '[' + attr + '="' + attrValue + '" i]';
}

// ---------------------------------------------------------------------------
// Helper: wait for domcontentloaded
// ---------------------------------------------------------------------------
async function waitForPageLoad(page, timeout) {
  await page.waitForLoadState('domcontentloaded', { timeout: timeout || 10000 });
}

// ---------------------------------------------------------------------------
// Helper: navigate to a URL, tolerating empty-response errors (Firefox)
// ---------------------------------------------------------------------------
async function gotoUrl(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (e) {
    if (!/NS_ERROR_NET_EMPTY_RESPONSE|net::ERR_EMPTY_RESPONSE/.test(e.message)) throw e;
  }
}

// ---------------------------------------------------------------------------
// Helper: fill a field located by label, placeholder, or name
// ---------------------------------------------------------------------------
async function fillField(page, field, value) {
  const byLabel = page.getByLabel(field, { exact: true });
  if (await byLabel.count() > 0) {
    await byLabel.fill(value);
    return;
  }
  const byPlaceholder = page.getByPlaceholder(field, { exact: true });
  if (await byPlaceholder.count() > 0) {
    await byPlaceholder.fill(value);
    return;
  }
  await page.locator(`[name="${field}"]`).first().fill(value);
}

// ---------------------------------------------------------------------------
// Helper: get text from a locator — input value or text content
// ---------------------------------------------------------------------------
async function getLocatorText(locator) {
  try {
    return await locator.inputValue();
  } catch {
    return await locator.textContent() || '';
  }
}

const MODAL_SELECTOR = '.modal, .modal.show, .modal.in, [role="dialog"], .dialog, .popup';

// ---------------------------------------------------------------------------
// Helper: wait for any matching modal element to reach a state
// ---------------------------------------------------------------------------
async function waitForModalState(page, state, timeout) {
  const sel = MODAL_SELECTOR;
  if (state === 'visible') {
    await page.waitForFunction(
      (s) => Array.from(document.querySelectorAll(s)).some(el => {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null;
      }),
      sel, { timeout }
    );
  } else {
    await page.waitForFunction(
      (s) => !Array.from(document.querySelectorAll(s)).some(el => {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null;
      }),
      sel, { timeout }
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: find the first visible modal locator
// ---------------------------------------------------------------------------
async function findVisibleModal(page) {
  const all = page.locator(MODAL_SELECTOR);
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    if (await all.nth(i).isVisible()) return all.nth(i);
  }
  throw new Error('No visible modal found');
}

// ---------------------------------------------------------------------------
// Helper: check if any modal is currently visible
// ---------------------------------------------------------------------------
async function isAnyModalVisible(page) {
  return page.evaluate((sel) =>
    Array.from(document.querySelectorAll(sel)).some(el => {
      const cs = window.getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null;
    }),
    MODAL_SELECTOR
  );
}

/**
 * Clear cookies and navigate to the launch URL as an anonymous visitor.
 *
 * Example #1: Given I am an anonymous user
 * Example #2: Given we are an anonymous user
 * Example #3: Given an anonymous user
 *
 */
Given(/^(I am |we are )?an anonymous user$/, async function (pronounCase) {
  await this.context.clearCookies();
  await gotoUrl(this.page, this.launchUrl);
  await waitForPageLoad(this.page, this.minWaitTime.page || 3000);
});

/**
 * Open the homepage.
 *
 * Example #1: Given I am on homepage
 * Example #2: Given I am on the homepage
 * Example #3: Given I am on frontpage
 * Example #4: Given I am on the frontpage
 * Example #5: Given we are on homepage
 * Example #6: Given we are on the frontpage
 * Example #7: Given on homepage
 * Example #8: Given on the homepage
 * Example #9: Given on frontpage
 * Example #10: Given on the frontpage
 *
 */
Given(/^(I am |we are )?on( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

/**
 * Open a specific page under the launch URL.
 *
 * Example #1: Given I am on "/about-us.html"
 * Example #2: Given I am on the "/about-us.html" page
 * Example #3: Given we are on "/user/login"
 * Example #4: Given we are on the "/contact-us.html" page
 * Example #5: Given on "/about-us.html"
 * Example #6: Given on the "/about-us.html" page
 * Example #7: Given I am on "https://un.org"
 *
 */
Given(/^(I am |we are )*on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, theCase, url, pageCase) {
  await gotoUrl(this.page, this.launchUrl + url);
  await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await waitForPageLoad(this.page);
});

/**
 * Navigate to the homepage.
 *
 * Example #1: When I go to homepage
 * Example #2: When I go to the homepage
 * Example #3: When I navigate to the homepage
 * Example #4: When navigating to the homepage
 * Example #5: When navigating to homepage
 * Example #6: When navigating to the frontpage
 * Example #7: When we go to the homepage
 * Example #8: When we navigate to the homepage
 *
 */
When(/^(I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

/**
 * Navigate to a specific page.
 *
 * Example #1: When I go to "/contact-us.html"
 * Example #2: When I go to "/user/login"
 * Example #3: When I navigate to "/admin/dashboard"
 * Example #4: When navigating to "/products"
 * Example #5: When we go to "/products"
 * Example #6: When we navigate to "/terms"
 *
 */
When(/^(I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$/, async function (pronounCase, url) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl + url);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

/**
 * Assert that text is or is not present on the page.
 *
 * Example #1: Then I should see "Welcome"
 * Example #2: Then we should see "Your accounts for the group is public"
 * Example #3: Then I should not see "Access denied"
 * Example #4: Then we should not see "Edit layout"
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?"$/, async function (pronounCase, notCase, expectedText) {
  if (notCase) {
    const text = await this.page.locator('body').textContent() || '';
    assert.ok(!text.includes(expectedText), `Page should NOT contain "${expectedText}" but it does.`);
  } else {
    await this.page.locator('body').filter({ hasText: expectedText }).waitFor({ timeout: 5000 });
  }
});

/**
 * Moves forward one page in browser history.
 *
 * Example #1: When I move forward one page
 * Example #2: When we move forward one page
 * Example #3: And move forward one page
 *
 */
When(/^(I |we )*move forward one page$/, async function (pronounCase) {
  await this.page.goForward();
});

/**
 * Moves backward one page in browser history.
 *
 * Example #1: When I move backward one page
 * Example #2: When we move backward one page
 * Example #3: And move backward one page
 *
 */
When(/^(I |we )*move backward one page$/, async function (pronounCase) {
  await this.page.goBack();
});

/**
 * Press a button, submit input, or link by its visible text.
 *
 * Example #1: When I press "Log In"
 * Example #2: And I press the "Log In" button
 * Example #3: And I press the "Save as" button
 * Example #4: When we press "Submit"
 * Example #5: And press "Cancel"
 *
 */
When(/^(I |we )*press( the)* "([^"]*)?"( button)*$/, async function (pronounCase, theCase, element, buttonCase) {
  const esc = element.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await this.page.locator('button, input[type="button"], input[type="submit"], [role="button"], .btn, a')
    .filter({ hasText: new RegExp('^' + esc + '$') })
    .first()
    .click();
});

/**
 * Press a button by its attribute (id, class, name, placeholder, data-*).
 *
 * Example #1: When I press "btn-pressid" by attr
 * Example #2: When I press "btn-pressid" by attribute
 * Example #3: And I press "Your full name" by "placeholder" attribute
 * Example #4: And I press "Your full name" by its "placeholder" attribute
 * Example #5: And I press "save-name" by "data-selector" attr
 *
 */
When(/^(I |we )*press "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().click();
});

/**
 * Click a link or button by its visible text.
 *
 * Example #1: When I click "Contact Us"
 * Example #2: And I click "aboutUs"
 * Example #3: When we click "Read more"
 * Example #4: And click "Home"
 *
 */
When(/^(I |we )*click "([^"]*)?"$/, async function (pronounCase, item) {
  const esc = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await this.page.locator('a, button, [role="button"], .btn, input[type="button"], input[type="submit"]')
    .filter({ hasText: new RegExp('^' + esc + '$') })
    .first()
    .click();
});

/**
 * Click a link or button by its attribute (id, class, name, data-*).
 *
 * Example #1: When I click "#about-us-id" by attr
 * Example #2: When I click "data-selector-about" by attribute
 * Example #3: And I click "about-us-css" by "class" attr
 * Example #4: And I click "about-us-id" by its "id" attribute
 *
 */
When(/^(I |we )*click "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().click();
});

/**
 * Click a clickable element inside a table row identified by text.
 *
 * Example #1: When I click "Edit" in the "John Smith" row
 * Example #2: When I click "Delete" in the "Product A" row
 * Example #3: When we click "View Details" in the "Order #12345" row
 * Example #4: And I click "Download" in the "Report 2024" row
 *
 */
When(/^(I |we )*click "([^"]*)?" in( the)* "([^"]*)?" row$/, async function (pronounCase, clickText, theCase, rowIdentifier) {
  const esc = clickText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = this.page.locator('tr').filter({ hasText: rowIdentifier }).first();
  const clickable = row.locator('a, button, [role="button"], .btn, input[type="submit"], input[type="button"]')
    .filter({ hasText: new RegExp('^' + esc + '$') });
  if (await clickable.count() > 0) {
    await clickable.first().click();
  } else {
    await row.getByText(clickText, { exact: true }).first().click();
  }
});

/**
 * Assert text is or is not visible inside a table row identified by text.
 *
 * Example #1: Then I should see "Active" in the "John Smith" row
 * Example #2: Then I should see "In Stock" in the "Product A" row
 * Example #3: Then we should see "Processing" in the "Order #12345" row
 * Example #4: And I should see "Admin" in the "john.smith@example.com" row
 * Example #5: Then I should not see "Admin" in the "Jane Doe" row
 * Example #6: Then I should not see "Out of Stock" in the "Product A" row
 * Example #7: And I should not see "Inactive" in the "john.smith@example.com" row
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" row$/, async function (pronounCase, notCase, expectedText, theCase, rowIdentifier) {
  const found = await this.page.evaluate(({ id, text }) => {
    const rows = Array.from(document.querySelectorAll('tr'));
    return rows.filter(r => r.textContent.includes(id)).some(r => r.textContent.includes(text));
  }, { id: rowIdentifier, text: expectedText });
  if (notCase) {
    assert.ok(!found, `Found "${expectedText}" in the "${rowIdentifier}" row, but it should not be there.`);
  } else {
    assert.ok(found, `Could not find "${expectedText}" in the "${rowIdentifier}" row.`);
  }
});

/**
 * Reloads the current page.
 *
 * Example #1: When I reload
 * Example #2: And I reload the page
 * Example #3: And we reload page
 * Example #4: And we reload the page
 *
 */
When(/^(I |we )*reload( the)*( page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.reload();
});

/**
 * Fill an input field located by its label, placeholder, or name.
 *
 * Example #1: When I fill in "Username" with "John Smith"
 * Example #2: When I fill in "Email" with "jon@example.com"
 * Example #3: And we fill in "Organization" with "Webship.co"
 * Example #4: And I fill in "Password" with "1234"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?"$/, async function (pronounCase, field, value) {
  await fillField(this.page, field, value);
});

/**
 * Fill an input field located by its attribute.
 *
 * Example #1: When I fill in "#uname" with "John Smith" by attr
 * Example #2: When I fill in "uname" with "John Smith" by attr
 * Example #3: And I fill in "pwordcss" with "1234" by "class" attr
 * Example #4: And I fill in "Your full name" with "John Smith" by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill(txtValue);
});

/**
 * Clear an input field located by its label.
 *
 * Example #1: When I fill in "Username" with:
 * Example #2: And we fill in "Email" with:
 * Example #3: And I fill in "Password" with:
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with:$/, async function (pronounCase, field) {
  await fillField(this.page, field, '');
});

/**
 * Clear an input field located by its attribute.
 *
 * Example #1: When I fill in "#uname" with: by attr
 * Example #2: When I fill in "uname" with: by attr
 * Example #3: And I fill in "pwordcss" with: by "class" attr
 * Example #4: And I fill in "Your full name" with: by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill('');
});

/**
 * Fill an input field located by label (reverse syntax).
 *
 * Example #1: When I fill in "jon-smith" for "Username"
 * Example #2: When we fill in "Testing" for "Organization options"
 * Example #3: And I fill in "1234" for "Password"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, async function (pronounCase, value, field) {
  await fillField(this.page, field, value);
});

/**
 * Fill an input field located by attribute (reverse syntax).
 *
 * Example #1: When I fill in "John Smith" for "#uname" by attr
 * Example #2: When I fill in "John Smith" for "uname" by attr
 * Example #3: And I fill in "1234" for "password" by "class" attr
 * Example #4: And I fill in "John Smith" for "Your full name" by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill(txtValue);
});

/**
 * Fills multiple form fields from a data table, located by their labels.
 *
 * Example #1: When I fill in the following:
 *               | Username | webshipco |
 *               | Password | 1234 |
 * Example #2: And we fill in the following:
 *               | Email | jon@example.com |
 *               | Organization | Webship.co |
 *
 */
When(/^(I |we )*fill in( the)* following:$/, async function (pronounCase, theCase, table) {
  for (const [field, value] of table.raw()) {
    await fillField(this.page, field, value);
  }
});

/**
 * Fills multiple form fields from a data table, located by their attributes.
 *
 * Example #1: When I fill in the following: by attr
 *               | #uname | John Smith |
 *               | password | 1234 |
 * Example #2: When I fill in the following: by its "placeholder" attribute
 *               | Your full name | John Smith |
 *               | Your Password | 1234 |
 *
 */
When(/^(I |we )*fill in( the)* following: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, theCase, itsCase, attr, attrWord, table) {
  for (const [attrValue, value] of table.raw()) {
    await this.page.locator(buildSelector(attrValue, attr)).first().fill(value);
  }
});

/**
 * Select an option from a dropdown by label, id, class, or name.
 *
 * Example #1: When I select "Mercedes" from "Cars"
 * Example #2: When I select "saab" from "#cars"
 * Example #3: When I select "Mercedes" from "cars"
 * Example #4: And we select "English" from "Language"
 *
 */
When(/^(I |we )*select "([^"]*)?" from "([^"]*)?"$/, async function (pronounCase, option, selectList) {
  let loc;
  if (selectList.startsWith('#') || selectList.startsWith('.')) {
    loc = this.page.locator(selectList);
  } else if (!selectList.includes(' ')) {
    loc = this.page.locator(`[name="${selectList}"], #${selectList}`).first();
  } else {
    loc = this.page.getByLabel(selectList, { exact: true });
  }
  try {
    await loc.selectOption({ label: option }, { timeout: 3000 });
  } catch {
    await loc.selectOption(option);
  }
});

/**
 * Add an option to a <select multiple> without clearing the existing selection.
 * Resolves the select by label, then by [name]/#id fallback.
 *
 * Example #1: When I additionally select "Red" from "Colors"
 * Example #2: When I additionally select "Blue" from "Colors"
 * Example #3: When we additionally select "Green" from "Colors"
 * Example #4: And additionally select "Yellow" from "Colors"
 * Example #5: When I additionally select "Admin" from "Roles"
 * Example #6: When we additionally select "Editor" from "Roles"
 * Example #7: When I additionally select "Viewer" from "Roles"
 * Example #8: And I additionally select "EN" from "Languages"
 * Example #9: When I additionally select "FR" from "Languages"
 * Example #10: When we additionally select "ES" from "Languages"
 *
 * Advanced:
 * Example #11: Build a full multi-selection in sequence:
 *   When I select "Red" from "Colors"
 *   And  I additionally select "Blue" from "Colors"
 *   And  I additionally select "Green" from "Colors"
 * Example #12: Works against a [name] select:
 *   When I additionally select "tag-a" from "tags"
 *   And  I additionally select "tag-b" from "tags"
 * Example #13: Confirm the select stays multi-valued after adds:
 *   When I select "One" from "Items"
 *   And  I additionally select "Two" from "Items"
 */
When(/^(I |we )*additionally select "([^"]*)" from "([^"]*)"$/, async function (pronounCase, option, select) {
  const loc = this.page.getByLabel(select).or(
    this.page.locator(`select[name="${select}"], select#${select}`)
  ).first();

  const currentValues = await loc.evaluate((el) => {
    if (!el || !el.selectedOptions) return [];
    return Array.from(el.selectedOptions).map((o) => o.value);
  });

  const nextValueForLabel = await loc.evaluate((el, label) => {
    const opt = Array.from(el.options || []).find((o) => o.label === label || o.text === label);
    return opt ? opt.value : null;
  }, option);

  if (nextValueForLabel === null) {
    throw new Error(`Option "${option}" not found in select "${select}".`);
  }

  const combined = Array.from(new Set([...currentValues, nextValueForLabel]));
  await loc.selectOption(combined);
});

/**
 * Checks the specified checkbox by label, id, class, or name.
 *
 * Example #1: When I check "Remember me"
 * Example #2: When we check "Put site into maintenance mode"
 * Example #3: And I check "#newsletter"
 * Example #4: And we check ".terms-and-conditions"
 *
 */
When(/^(I |we )*check "([^"]*)?"$/, async function (pronounCase, item) {
  if (item.startsWith('#') || item.startsWith('.')) {
    await this.page.locator(item).check();
  } else {
    const byLabel = this.page.getByLabel(item, { exact: true });
    if (await byLabel.count() > 0) {
      await byLabel.check();
    } else {
      await this.page.locator(`input[type="checkbox"][id="${item}"], input[type="checkbox"][name="${item}"], input[type="checkbox"][value="${item}"]`).first().check();
    }
  }
});

/**
 * Unchecks the specified checkbox by label, id, class, or name.
 *
 * Example #1: When I uncheck "Remember me"
 * Example #2: When we uncheck "Put site into maintenance mode"
 * Example #3: And I uncheck "#newsletter"
 * Example #4: And we uncheck ".terms-and-conditions"
 *
 */
When(/^(I |we )*uncheck "([^"]*)?"$/, async function (pronounCase, item) {
  if (item.startsWith('#') || item.startsWith('.')) {
    await this.page.locator(item).uncheck();
  } else {
    const byLabel = this.page.getByLabel(item, { exact: true });
    if (await byLabel.count() > 0) {
      await byLabel.uncheck();
    } else {
      await this.page.locator(`input[type="checkbox"][id="${item}"], input[type="checkbox"][name="${item}"], input[type="checkbox"][value="${item}"]`).first().uncheck();
    }
  }
});

/**
 * Selects a radio button by label, value, id, or class.
 *
 * Example #1: When I select radio button "Male"
 * Example #2: When I select radio button "female"
 * Example #3: When I select radio button "#gender-male"
 * Example #4: When we select radio button "option1"
 *
 */
When(/^(I |we )*select radio button "([^"]*)?"$/, async function (pronounCase, item) {
  if (item.startsWith('#') || item.startsWith('.')) {
    await this.page.locator(item).check();
  } else {
    const byValue = this.page.locator(`input[type="radio"][value="${item}"]`);
    if (await byValue.count() > 0) {
      await byValue.first().check();
    } else {
      await this.page.getByLabel(item, { exact: true }).check();
    }
  }
});

/**
 * Assert that the current page is or is not the homepage.
 *
 * Example #1: Then I should be on homepage
 * Example #2: And I should be on the homepage
 * Example #3: Then I should be on frontpage
 * Example #4: And should be on the homepage
 * Example #5: Then should be on homepage
 * Example #6: And we should be on homepage
 * Example #7: Then should be on frontpage
 * Example #8: And we should be on the homepage
 * Example #9: Then I should not be on homepage
 * Example #10: And I should not be on the homepage
 *
 */
Then(/^(I |we )*should( not)* be on( the)* (homepage|frontpage)$/, async function (pronounCase, notCase, theCase, pageCase) {
  const currentUrl = this.page.url();
  if (notCase) {
    assert.ok(currentUrl !== this.launchUrl && !currentUrl.startsWith(this.launchUrl + '/'),
      `Should NOT be on homepage but current URL is: ${currentUrl}`);
  } else {
    assert.ok(currentUrl.startsWith(this.launchUrl),
      `Should be on homepage but current URL is: ${currentUrl}`);
  }
});

/**
 * Assert that the current path is or is not equal to the specified path.
 *
 * Example #1: Then I should be on "/"
 * Example #2: And I should be on "/user/login"
 * Example #3: And I should be on "https://un.org"
 * Example #4: Then we should be on the "/" page
 * Example #5: And we should be on "/user/login"
 * Example #6: Then should be on the "/user/reset" page
 * Example #7: Then I should not be on "/"
 * Example #8: And I should not be on "/user/login"
 * Example #9: And I should not be on "https://un.org"
 * Example #10: And we should not be on the "https://un.org" page
 *
 */
Then(/^(I |we )*should( not)* be on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, notCase, theCase, url, pageCase) {
  const currentUrl = this.page.url();
  if (notCase) {
    assert.ok(!currentUrl.includes(url), `URL should NOT contain "${url}" but it is: ${currentUrl}`);
  } else {
    assert.ok(currentUrl.includes(url), `URL should contain "${url}" but it is: ${currentUrl}`);
  }
});

/**
 * Assert that a link (located by its visible text) contains the given URL.
 *
 * Example #1: Then the "Login" link should contain "/log-in"
 * Example #2: And the "About Us" link should contain "/about"
 * Example #3: Then "Home" link should contain "/"
 *
 */
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?"$/, async function (theCase, element, url) {
  const loc = this.page.getByText(element, { exact: true }).first();
  await loc.waitFor({ timeout: 5000 });
  const href = await loc.evaluate(el => el.href || el.getAttribute('href') || '');
  assert.ok(href.includes(url), `Expected link "${element}" href to contain "${url}" but got "${href}"`);
});

/**
 * Assert that a link located by its attribute contains the given URL.
 *
 * Example #1: Then the "#about-us-id" link should contain "about" by attr
 * Example #2: And the "aboutUs" link should contain "about" by its "class" attribute
 * Example #3: And the ".contactUs" link should contain "/contact-" by attr
 *
 */
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (theCase, attrValue, url, itsCase, attr, attrWord) {
  const loc = this.page.locator(buildSelector(attrValue, attr)).first();
  await loc.waitFor({ timeout: 5000 });
  const href = await loc.evaluate(el => el.href || el.getAttribute('href') || '');
  assert.ok(href.includes(url), `Expected element href to contain "${url}" but got "${href}"`);
});

/**
 * Assert that HTML response contains or does not contain specific text.
 *
 * Example #1: Then the response should contain "Welcome visitor, How can I help you?"
 * Example #2: Then the response should not contain "Access denied"
 *
 */
Then(/^(the )*response should( not)* contain "([^"]*)?"$/, async function (theCase, notCase, expectedText) {
  const text = await this.page.locator('html').textContent() || '';
  if (notCase) {
    assert.ok(!text.includes(expectedText), `Response should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(text.includes(expectedText), `Response should contain "${expectedText}" but it does not.`);
  }
});

/**
 * Assert that an element (found by its label) contains or does not contain text.
 *
 * Example #1: Then I should see "John Smith" in the "Username" element
 * Example #2: Then I should not see "Joe Smith" in the "Username" element
 * Example #3: And we should see "1234" in the "Password" element
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element$/, async function (pronounCase, notCase, expectedText, theCase, element) {
  const forAttr = await this.page.getByText(element, { exact: true }).getAttribute('for').catch(() => null);
  const loc = this.page.locator(forAttr ? '#' + forAttr : element).first();
  await loc.waitFor({ timeout: 5000 });
  const content = await getLocatorText(loc);
  if (notCase) {
    assert.ok(!content.includes(expectedText), `Element should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(content.includes(expectedText), `Element should contain "${expectedText}" but it does not.`);
  }
});

/**
 * Assert that an element (found by its attribute) contains or does not contain text.
 *
 * Example #1: Then I should see "John Smith" in the "uname" element by its "id" attr
 * Example #2: Then I should see "1234" in the "pwordcss" element by attr
 * Example #3: Then I should not see "John Smith" in the "uname" element by its "id" attr
 * Example #4: Then I should not see "1234" in the "pwordcss" element by attr
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, notCase, expectedText, theCase, attrValue, itsCase, attr, attrWord) {
  const loc = this.page.locator(buildSelector(attrValue, attr)).first();
  await loc.waitFor({ timeout: 10000 });
  const content = await getLocatorText(loc);
  if (notCase) {
    assert.ok(!content.includes(expectedText), `Element should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(content.includes(expectedText), `Element should contain "${expectedText}" but it does not.`);
  }
});

/**
 * Assert that an element with a given label exists (or does not) on the page.
 *
 * Example #1: Then I should see a "Username" element
 * Example #2: Then I should not see a "Username" element
 * Example #3: And we should see an "Email" element
 *
 */
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element$/, async function (pronounCase, notCase, aAnCase, element) {
  if (notCase) {
    const text = await this.page.locator('body').textContent() || '';
    assert.ok(!text.includes(element), `Page should NOT contain element text "${element}" but it does.`);
  } else {
    const loc = this.page.getByText(element, { exact: true }).first();
    const forAttr = await loc.getAttribute('for').catch(() => null);
    if (forAttr) {
      await this.page.locator('#' + forAttr).waitFor({ state: 'visible', timeout: 3000 });
    } else {
      await loc.waitFor({ state: 'visible', timeout: 3000 });
    }
  }
});

/**
 * Assert that an element, identified by attribute, exists (or does not) on the page.
 *
 * Example #1: Then I should see a "uname" element by its "id" attr
 * Example #2: Then I should see a "pwordcss" element by attr
 * Example #3: Then I should not see an "emailId" element by its "id" attr
 * Example #4: And I should not see a "countryCss" element by attr
 *
 */
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, notCase, aAnCase, attrValue, itsCase, attr, attrWord) {
  const loc = this.page.locator(buildSelector(attrValue, attr));
  if (notCase) {
    assert.strictEqual(await loc.count(), 0, `Element should NOT be present but it is.`);
  } else {
    await loc.first().waitFor({ state: 'visible', timeout: 3000 });
  }
});

/**
 * Assert that an element has or does not have a specific CSS property.
 *
 * Example #1: Then the "body" element should contain "color:white;"
 * Example #2: Then the "body" element should not contain "color:white;"
 * Example #3: Then the "#uname" element should not contain "border:solid 5px red;"
 * Example #4: Then the "pword" element should not contain "font-size: 26px;"
 *
 */
Then(/^(the )*"([^"]*)?" element should( not)* contain "([^"]*)?"$/, async function (theCase, selectorRaw, notCase, elementCss) {
  const cssClean = elementCss.replace(/;$/, '');
  const colonIdx = cssClean.indexOf(':');
  const cssProperty = cssClean.substring(0, colonIdx).trim();
  const expectedValue = cssClean.substring(colonIdx + 1).trim();

  const loc = this.page.locator(buildSelector(selectorRaw)).first();
  await loc.waitFor({ timeout: 10000 });
  const matches = await loc.evaluate((el, { prop, expectedVal }) => {
    function colorToRgb(color) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgb(1, 2, 3)';
      ctx.fillStyle = color.trim();
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return 'rgb(' + d[0] + ', ' + d[1] + ', ' + d[2] + ')';
    }
    function isValidColor(value) { return colorToRgb(value) !== 'rgb(1, 2, 3)'; }
    function normalizeColorTokens(value) {
      return value.replace(/rgb\([^)]+\)|rgba\([^)]+\)|#[0-9a-fA-F]+|\b[a-zA-Z]+\b/g,
        (token) => isValidColor(token) ? colorToRgb(token) : token);
    }
    function tokenize(value) {
      const tokens = [], regex = /rgb\([^)]+\)|rgba\([^)]+\)|[^\s]+/g;
      let m;
      while ((m = regex.exec(value)) !== null) tokens.push(m[0]);
      return tokens;
    }
    const computed = window.getComputedStyle(el).getPropertyValue(prop).trim();
    return tokenize(normalizeColorTokens(expectedVal.toLowerCase()))
      .every(token => normalizeColorTokens(computed.toLowerCase()).includes(token));
  }, { prop: cssProperty, expectedVal: expectedValue });

  if (notCase) {
    assert.ok(!matches, `Element should NOT have CSS "${cssProperty}: ${expectedValue}" but it does.`);
  } else {
    assert.ok(matches, `Element should have CSS "${cssProperty}: ${expectedValue}".`);
  }
});

/**
 * Assert that a form field contains or does not contain specific text.
 *
 * Example #1: Then the "Username" field should contain "John Smith"
 * Example #2: Then the "#username" field should not contain "John Smith"
 * Example #3: And the "Email" field should contain "jon@example.com"
 *
 */
Then(/^(the )*"([^"]*)?" field should( not)* contain "([^"]*)?"$/, async function (theCase, field, notCase, expectedText) {
  let selector = field;
  if (!field.startsWith('#') && !field.startsWith('.')) {
    const forAttr = await this.page.getByText(field, { exact: true }).getAttribute('for').catch(() => null);
    if (forAttr) selector = '#' + forAttr;
  }
  const loc = this.page.locator(selector).first();
  await loc.waitFor({ timeout: 5000 });
  const content = await getLocatorText(loc);
  if (notCase) {
    assert.ok(!content.includes(expectedText), `Field should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(content.includes(expectedText), `Field should contain "${expectedText}" but it does not.`);
  }
});

/**
 * Assert that a checkbox should or should not be checked.
 *
 * Example #1: Then the "#PrivacyPolicy" checkbox should be checked
 * Example #2: Then the "#PrivacyPolicy" checkbox should not be checked
 *
 */
Then(/^(the )*"([^"]*)?" checkbox should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a checkbox is or is not checked.
 *
 * Example #1: Then the "#rememberMe" checkbox is checked
 * Example #2: Then the "#rememberMe" checkbox is not checked
 *
 */
Then(/^(the )*"([^"]*)?" checkbox is( not)* checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a named checkbox should or should not be checked.
 *
 * Example #1: Then the checkbox "#PrivacyPolicy" should be checked
 * Example #2: Then the checkbox "#PrivacyPolicy" should not be checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a named checkbox is or is not checked.
 *
 * Example #1: Then the checkbox "#rememberMe" is checked
 * Example #2: Then the checkbox "#rememberMe" is not checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" is( not)* checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a radio button should or should not be selected.
 *
 * Example #1: Then the radio button "#gender-male" should be selected
 * Example #2: Then the radio button "#gender-female" should not be selected
 * Example #3: Then the radio button ".option-1" should be selected
 *
 */
Then(/^(the )*radio button "([^"]*)?" should( not)* be selected$/, async function (theCase, radioButton, notCase) {
  const isChecked = await this.page.locator(radioButton).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assert.ok(isChecked, `Radio button "${radioButton}" should be selected but it is not.`);
  }
});

/**
 * Assert that a radio button with a given value should or should not be selected.
 *
 * Example #1: Then the radio button with value "male" should be selected
 * Example #2: Then the radio button with value "female" should not be selected
 *
 */
Then(/^(the )*radio button with value "([^"]*)?" should( not)* be selected$/, async function (theCase, radioValue, notCase) {
  const isChecked = await this.page.locator(`input[type="radio"][value="${radioValue}"]`).first().isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Radio button with value "${radioValue}" should NOT be selected but it is.`);
  } else {
    assert.ok(isChecked, `Radio button with value "${radioValue}" should be selected but it is not.`);
  }
});

/**
 * Assert that the radio button is or is not selected.
 *
 * Example #1: Then the "#gender-male" radio button is selected
 * Example #2: Then the "#gender-female" radio button is not selected
 *
 */
Then(/^(the )*"([^"]*)?" radio button is( not)* selected$/, async function (theCase, radioButton, notCase) {
  const isChecked = await this.page.locator(radioButton).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assert.ok(isChecked, `Radio button "${radioButton}" should be selected but it is not.`);
  }
});

/**
 * Assert that the current page's response status is or is not a given code.
 *
 * Example #1: Then the response status code should be 200
 * Example #2: And the response status code should not be 404
 * Example #3: Then the response status code should be 301
 *
 */
Then(/^(the )*response status code should( not)* be (\d+)$/, async function (theCase, notCase, expectedStatusCode) {
  const currentURL = this.page.url();
  try {
    const response = await axios.get(currentURL);
    const status = response.status;
    if (notCase) {
      assert.notStrictEqual(status, parseInt(expectedStatusCode), `Status code should NOT be ${expectedStatusCode}`);
    } else {
      assert.strictEqual(status, parseInt(expectedStatusCode), `Expected status ${expectedStatusCode} but got ${status}`);
    }
  } catch (error) {
    const status = error.response ? error.response.status : null;
    if (notCase) {
      if (status !== null) assert.notStrictEqual(status, parseInt(expectedStatusCode));
    } else {
      assert.strictEqual(status, parseInt(expectedStatusCode), `Expected status ${expectedStatusCode} but got ${status}`);
    }
  }
});

/**
 * Assert that page contains or does not contain text matching a regex pattern.
 *
 * Example #1: Then I should see text matching "^T\w+"
 * Example #2: Then I should not see text matching "^O\w+"
 * Example #3: And we should see text matching "\d{4}"
 *
 */
Then(/^(I |we )*should( not)* see text matching "([^"]*)?"$/, async function (pronounCase, notCase, textPattern) {
  const bodyText = await this.page.evaluate(() => document.body.innerText || '');
  const regex = new RegExp(textPattern);
  if (notCase) {
    assert.ok(!regex.test(bodyText), `Page text should NOT match "${textPattern}" but it does.`);
  } else {
    assert.ok(regex.test(bodyText), `Page text should match "${textPattern}" but it does not.`);
  }
});

/**
 * Assert that an element contains or does not contain text matching a pattern.
 *
 * Example #1: Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element
 * Example #2: Then I should not see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element
 *
 */
Then(/^(I |we )*should( not)* see text matching "([^"]*)?" in( the)* "([^"]*)?" element$/, async function (pronounCase, notCase, textPattern, theCase, element) {
  const loc = this.page.locator(element).first();
  await loc.waitFor({ timeout: 5000 });
  const text = await getLocatorText(loc);
  const regex = new RegExp(textPattern);
  if (notCase) {
    assert.ok(!regex.test(text), `Element "${element}" text should NOT match "${textPattern}" but it does.`);
  } else {
    assert.ok(regex.test(text), `Element "${element}" text should match "${textPattern}" but it does not.`);
  }
});

/**
 * Assert that the current URL matches or does not match a regex pattern.
 *
 * Example #1: Then the url should match "/contact-us.html"
 * Example #2: Then the url should not match "/contact-us.html"
 * Example #3: And the url should match "^https://"
 *
 */
Then(/^(the )*url should( not)* match "([^"]*)?"$/, async function (theCase, notCase, pattern) {
  const currentUrl = this.page.url();
  const regex = new RegExp(pattern);
  if (notCase) {
    assert.ok(!regex.test(currentUrl), `URL "${currentUrl}" should NOT match "${pattern}" but it does.`);
  } else {
    assert.ok(regex.test(currentUrl), `URL "${currentUrl}" should match "${pattern}" but it does not.`);
  }
});

/**
 * Attach a file from tests/assets/ to a file input.
 *
 * Example #1: When I attach the file "profileIcon.jpg" to "#profile-icon-upload"
 * Example #2: And we attach file "resume.pdf" to "#resume"
 *
 */
When(/^(I |we )*attach( the)* file "([^"]*)?" to "([^"]*)?"$/, async function (pronounCase, theCase, fileName, element) {
  await this.page.locator(element).setInputFiles(path.resolve(this.assetsFolder, fileName));
});

/**
 * Wait a specific number of seconds.
 *
 * Example #1: When I wait 1 second
 * Example #2: When I wait 5 seconds
 * Example #3: When we wait 3s
 * Example #4: And wait 2s
 * Example #5: And wait 2 seconds
 * Example #6: When we wait 1 second
 * Example #7: When we wait 5 seconds
 * Example #8: When we wait 4s
 *
 */
When(/^(I |we )*wait (\d*)( second| seconds|s)?$/, async function (pronounCase, number, withSecondWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000);
});

/**
 * Wait a max number of seconds until the page body is present.
 *
 * Example #1: When I wait max of 1 second
 * Example #2: When I wait max of 5 seconds
 * Example #3: When we wait max of 3s
 * Example #4: And wait max of 2s
 * Example #5: And wait max of 2 seconds
 * Example #6: When we wait max of 1 second
 * Example #7: When we wait max of 5 seconds
 * Example #8: When we wait max of 4s
 *
 */
When(/^(I |we )*wait max of (\d*)( second| seconds|s)?$/, async function (pronounCase, number, withSecondWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000);
});

/**
 * Wait a specific number of minutes.
 *
 * Example #1: When I wait 1 minute
 * Example #2: When I wait 10 minutes
 * Example #3: When we wait 1m
 * Example #4: And wait 2m
 * Example #5: And wait 2 minutes
 * Example #6: When we wait 1 minute
 * Example #7: When we wait 10 minutes
 *
 */
When(/^(I |we )*wait (\d*)( minute| minutes|m)?$/, async function (pronounCase, number, withMinuteWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000 * 60);
});

/**
 * Wait a max number of minutes until the page body is present.
 *
 * Example #1: When I wait max of 1 minute
 * Example #2: When I wait max of 10 minutes
 * Example #3: When we wait max of 1m
 * Example #4: And wait max of 2m
 * Example #5: And wait max of 2 minutes
 *
 */
When(/^(I |we )*wait max of (\d*)( minute| minutes|m)?$/, async function (pronounCase, number, withMinuteWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000 * 60);
});

/**
 * Wait until the page is loaded.
 *
 * Example #1: When I wait until the page is loaded
 * Example #2: When we wait until the page is loaded
 * Example #3: When wait until page loaded
 *
 */
When(/^(I |we )*wait until( the)* page( is)* loaded*$/, async function (pronounCase, theCase, withIs) {
  await waitForPageLoad(this.page, 10000);
});

/**
 * Wait for active XHR/fetch requests to complete.
 *
 * Example #1: When I wait for AJAX to finish
 * Example #2: And I wait for AJAX to finish
 * Example #3: When we wait for AJAX to finish
 * Example #4: And wait for AJAX to finish
 *
 */
When(/^(I |we )*wait for AJAX to finish$/, async function (pronounCase) {
  await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
});

/**
 * Scrolls the page down by a custom number of pixels (default 350).
 *
 * Example #1: And I scroll down
 * Example #2: When I scroll down 800
 * Example #3: And we scroll down 500
 * Example #4: When scrolling down 1200
 *
 */
When(/^(I scroll|we scroll|scrolling)? down(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(0, v), numValue ? parseInt(numValue, 10) : 350);
});

/**
 * Scrolls the page up by a custom number of pixels (default 350).
 *
 * Example #1: And I scroll up
 * Example #2: When I scroll up 1000
 * Example #3: And we scroll up 300
 * Example #4: When scrolling up 750
 *
 */
When(/^(I scroll|we scroll|scrolling)? up(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(0, -v), numValue ? parseInt(numValue, 10) : 350);
});

/**
 * Scrolls to the very top of the current page.
 *
 * Example #1: When I scroll to top
 * Example #2: And we scroll to the top
 * Example #3: When scrolling to the top of the page
 *
 */
When(/^(I scroll|we scroll|scrolling)? to( the)* top( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(0, 0));
});

/**
 * Scrolls to the bottom of the current page.
 *
 * Example #1: When I scroll to the bottom
 * Example #2: And we scroll to bottom
 * Example #3: When scrolling to the bottom of the page
 *
 */
When(/^(I scroll|we scroll|scrolling)? to( the)* bottom( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if ((s.overflowY === 'scroll' || s.overflowY === 'auto') && el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
        el.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    });
  });
});

/**
 * Scrolls to the top of a specific element identified by a CSS selector.
 *
 * Example #1: When I scroll to top of "#off-canvas"
 * Example #2: And we scroll to top of "#sidebar"
 * Example #3: When scrolling to top of "#main-container"
 *
 */
When(/^(I scroll|we scroll|scrolling)? to top of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => {
    el.scrollTop = 0;
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
});

/**
 * Scrolls to the bottom of a specific element identified by a CSS selector.
 *
 * Example #1: When I scroll to bottom of "#off-canvas"
 * Example #2: And we scroll to bottom of "#sidebar"
 * Example #3: When scrolling to bottom of "#main-container"
 *
 */
When(/^(I scroll|we scroll|scrolling)? to bottom of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
});

/**
 * Scrolls the page right by a custom number of pixels (default 350).
 *
 * Example #1: And I scroll right
 * Example #2: When I scroll right 1000
 * Example #3: And we scroll right 300
 * Example #4: When scrolling right 750
 *
 */
When(/^(I scroll|we scroll|scrolling)? right(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(v, 0), numValue ? parseInt(numValue, 10) : 350);
});

/**
 * Scrolls the page left by a custom number of pixels (default 350).
 *
 * Example #1: And I scroll left
 * Example #2: When I scroll left 800
 * Example #3: And we scroll left 500
 * Example #4: When scrolling left 1200
 *
 */
When(/^(I scroll|we scroll|scrolling)? left(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(-v, 0), numValue ? parseInt(numValue, 10) : 350);
});

/**
 * Scrolls to the start (horizontal origin) of the page.
 *
 * Example #1: When I scroll to start
 * Example #2: And we scroll to the start
 * Example #3: When scrolling to the start of the page
 *
 */
When(/^(I scroll|we scroll|scrolling)? to( the)* start( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(0, window.scrollY));
});

/**
 * Scrolls to the end (horizontal maximum) of the page.
 *
 * Example #1: When I scroll to the end
 * Example #2: And we scroll to end
 * Example #3: When scrolling to the end of the page
 *
 */
When(/^(I scroll|we scroll|scrolling)? to( the)* end( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(document.body.scrollWidth, window.scrollY));
});

/**
 * Scrolls to the start of a specific element identified by a CSS selector.
 *
 * Example #1: When I scroll to start of "#off-canvas"
 * Example #2: And we scroll to start of "#sidebar"
 * Example #3: When scrolling to start of "#main-container"
 *
 */
When(/^(I scroll|we scroll|scrolling)? to start of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => { el.scrollLeft = 0; });
});

/**
 * Scrolls to the end of a specific element identified by a CSS selector.
 *
 * Example #1: When I scroll to end of "#off-canvas"
 * Example #2: And we scroll to end of "#sidebar"
 * Example #3: When scrolling to end of "#main-container"
 *
 */
When(/^(I scroll|we scroll|scrolling)? to end of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => { el.scrollLeft = el.scrollWidth; });
});

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
  const visible = await isAnyModalVisible(this.page);
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
  const modal = this.page.locator(MODAL_SELECTOR);
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
  const found = await this.page.locator(MODAL_SELECTOR).filter({ hasText: expectedText }).count() > 0;
  if (notCase) {
    assert.ok(!found, `Found "${expectedText}" in modal, but it should not be there.`);
  } else {
    assert.ok(found, `Could not find "${expectedText}" in modal.`);
  }
});

/**
 * Click a button or link inside a modal dialog.
 *
 * Example #1: When I click "Confirm" in the modal
 * Example #2: When I click "Cancel" in the modal dialog
 * Example #3: When we click "OK" button in the modal
 * Example #4: And I click "Close" in the modal
 *
 */
When(/^(I |we )*click "([^"]*)?"( button)* in( the)* modal( dialog)*$/, async function (pronounCase, buttonText, buttonCase, theCase, dialogCase) {
  await waitForModalState(this.page, 'visible', 10000);
  const modal = await findVisibleModal(this.page);
  await modal.locator('button, a, [role="button"], input[type="button"], input[type="submit"], .btn')
    .filter({ hasText: buttonText })
    .first()
    .click();
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
  await waitForModalState(this.page, 'visible', 10000);
  const modal = await findVisibleModal(this.page);
  const closeBtn = modal.locator('.close, .modal-close, [data-dismiss="modal"], [aria-label="Close"], .btn-close, button[class*="close"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  } else {
    await modal.press('Escape');
  }
});

/**
 * Wait for a modal dialog to appear or disappear.
 *
 * Example #1: When I wait for the modal to appear
 * Example #2: When I wait for the modal to disappear
 * Example #3: When we wait for modal to appear
 * Example #4: And I wait for the modal dialog to disappear
 *
 */
When(/^(I |we )*wait for( the)* modal( dialog)* to (appear|disappear)$/, async function (pronounCase, theCase, dialogCase, appearOrDisappear) {
  const state = appearOrDisappear === 'appear' ? 'visible' : 'hidden';
  await waitForModalState(this.page, state, 10000);
});

// ===========================================================================
// STEP DEFINITIONS — Follow link, count elements, debug helpers.
// ===========================================================================

/**
 * Follow a link by its visible text.
 * Uses Playwright's accessibility-first `getByRole('link', { name })` with a
 * text-match fallback.
 *
 * Example #1: When I follow "Contact Us"
 * Example #2: When I follow "About"
 * Example #3: When we follow "Home"
 * Example #4: And follow "Read more"
 * Example #5: When I follow "Documentation"
 * Example #6: When we follow "Sign in"
 * Example #7: When I follow "Log out"
 * Example #8: When I follow "Download report"
 * Example #9: And I follow "Previous"
 * Example #10: When I follow "Next"
 */
When(/^(I |we )*follow "([^"]*)"$/, async function (pronounCase, link) {
  const esc = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const loc = this.page.getByRole('link', { name: link, exact: true }).or(
    this.page.locator('a').filter({ hasText: new RegExp('^' + esc + '$') })
  ).first();
  await loc.click();
});

/**
 * Assert the exact number of elements matching a CSS selector.
 *
 * Example #1: Then I should see 3 "li" elements
 * Example #2: Then I should see 1 "h1" element
 * Example #3: Then we should see 5 ".card" elements
 * Example #4: Then I should see 0 ".error" elements
 * Example #5: And I should see 10 "table tr" elements
 * Example #6: Then I should see 2 "nav a" elements
 * Example #7: Then we should see 4 "ul li" elements
 * Example #8: Then I should see 1 "form" element
 * Example #9: And should see 6 ".product" elements
 * Example #10: Then I should see 8 "[data-testid='row']" elements
 */
Then(/^(I |we )*should see (\d+) "([^"]*)" elements?$/, async function (pronounCase, num, selector) {
  const expected = parseInt(num, 10);
  const actual = await this.page.locator(selector).count();
  if (actual !== expected) {
    throw new Error(`Expected ${expected} "${selector}" element(s), got ${actual}.`);
  }
});

/**
 * Print the current page URL to console (debug).
 *
 * Example #1: Then print current URL
 * Example #2: When print current URL
 * Example #3: And print current URL
 */
Then(/^print current URL$/, function () {
  console.log('\n--- Current URL ---');
  console.log(`  ${this.page.url()}`);
});

/**
 * Print the full page HTML (last response) to console (debug).
 *
 * Example #1: Then print last response
 * Example #2: When print last response
 * Example #3: And print last response
 */
Then(/^print last response$/, async function () {
  const html = await this.page.content();
  console.log('\n--- Last Response (HTML) ---');
  console.log(html);
});
