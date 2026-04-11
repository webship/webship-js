'use strict';

const { setWorldConstructor, World, Before, After, BeforeStep, AfterStep, setDefaultTimeout, Given, When, Then } = require('@cucumber/cucumber');
const playwright = require('playwright');
const playwrightConfig = require(require('path').join(process.cwd(), 'playwright.config'));
const assert = require('assert');
const axios = require('axios');
const path = require('path');

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

// ---------------------------------------------------------------------------
// Given I am an anonymous user
// Captures: (pronounCase) = 1
// ---------------------------------------------------------------------------
Given(/^(I am |we are )?an anonymous user$/, async function (pronounCase) {
  await this.context.clearCookies();
  await gotoUrl(this.page, this.launchUrl);
  await waitForPageLoad(this.page, this.minWaitTime.page || 3000);
});

// ---------------------------------------------------------------------------
// Given I am on homepage / frontpage
// Captures: (pronounCase, theCase, pageCase) = 3
// ---------------------------------------------------------------------------
Given(/^(I am |we are )?on( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// Given I am on "/about-us.html"
// Captures: (pronounCase, theCase, url, pageCase) = 4
// ---------------------------------------------------------------------------
Given(/^(I am |we are )*on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, theCase, url, pageCase) {
  await gotoUrl(this.page, this.launchUrl + url);
  await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await waitForPageLoad(this.page);
});

// ---------------------------------------------------------------------------
// When I go to homepage / frontpage
// Captures: (pronounCase, theCase, pageCase) = 3
// ---------------------------------------------------------------------------
When(/^(I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// When I go to "/contact-us.html"
// Captures: (pronounCase, url) = 2
// ---------------------------------------------------------------------------
When(/^(I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$/, async function (pronounCase, url) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl + url);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// Then I should see "text" / Then I should not see "text"
// Captures: (pronounCase, notCase, expectedText) = 3
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see "([^"]*)?"$/, async function (pronounCase, notCase, expectedText) {
  if (notCase) {
    const text = await this.page.locator('body').textContent() || '';
    assert.ok(!text.includes(expectedText), `Page should NOT contain "${expectedText}" but it does.`);
  } else {
    await this.page.locator('body').filter({ hasText: expectedText }).waitFor({ timeout: 5000 });
  }
});

// ---------------------------------------------------------------------------
// When I move forward one page
// Captures: (pronounCase) = 1
// ---------------------------------------------------------------------------
When(/^(I |we )*move forward one page$/, async function (pronounCase) {
  await this.page.goForward();
});

// ---------------------------------------------------------------------------
// When I move backward one page
// Captures: (pronounCase) = 1
// ---------------------------------------------------------------------------
When(/^(I |we )*move backward one page$/, async function (pronounCase) {
  await this.page.goBack();
});

// ---------------------------------------------------------------------------
// When I press "Log In" button
// Captures: (pronounCase, theCase, element, buttonCase) = 4
// ---------------------------------------------------------------------------
When(/^(I |we )*press( the)* "([^"]*)?"( button)*$/, async function (pronounCase, theCase, element, buttonCase) {
  const esc = element.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await this.page.locator('button, input[type="button"], input[type="submit"], [role="button"], .btn, a')
    .filter({ hasText: new RegExp('^' + esc + '$') })
    .first()
    .click();
});

// ---------------------------------------------------------------------------
// When I press "btn-pressid" by attr / attribute
// Captures: (pronounCase, attrValue, itsCase, attr, attrWord) = 5
// ---------------------------------------------------------------------------
When(/^(I |we )*press "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().click();
});

// ---------------------------------------------------------------------------
// When I click "Contact Us"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*click "([^"]*)?"$/, async function (pronounCase, item) {
  const esc = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await this.page.locator('a, button, [role="button"], .btn, input[type="button"], input[type="submit"]')
    .filter({ hasText: new RegExp('^' + esc + '$') })
    .first()
    .click();
});

// ---------------------------------------------------------------------------
// When I click "#about-us-id" by attr / attribute
// Captures: (pronounCase, attrValue, itsCase, attr, attrWord) = 5
// ---------------------------------------------------------------------------
When(/^(I |we )*click "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().click();
});

// ---------------------------------------------------------------------------
// When I click "Edit" in the "John Smith" row
// Captures: (pronounCase, clickText, theCase, rowIdentifier) = 4
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should see "Active" in the "John Smith" row
// Captures: (pronounCase, notCase, expectedText, theCase, rowIdentifier) = 5
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// When I reload the page
// Captures: (pronounCase, theCase, pageCase) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*reload( the)*( page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.reload();
});

// ---------------------------------------------------------------------------
// When I fill in "Username" with "John Smith"
// Captures: (pronounCase, field, value) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?"$/, async function (pronounCase, field, value) {
  await fillField(this.page, field, value);
});

// ---------------------------------------------------------------------------
// When I fill in "uname" with "John Smith" by attr
// Captures: (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) = 6
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill(txtValue);
});

// ---------------------------------------------------------------------------
// When I fill in "Username" with: (empty)
// Captures: (pronounCase, field) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with:$/, async function (pronounCase, field) {
  await fillField(this.page, field, '');
});

// ---------------------------------------------------------------------------
// When I fill in "uname" with: by attr (empty by attr)
// Captures: (pronounCase, attrValue, itsCase, attr, attrWord) = 5
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill('');
});

// ---------------------------------------------------------------------------
// When I fill in "John Smith" for "Username"
// Captures: (pronounCase, value, field) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, async function (pronounCase, value, field) {
  await fillField(this.page, field, value);
});

// ---------------------------------------------------------------------------
// When I fill in "John Smith" for "uname" by attr
// Captures: (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) = 6
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill(txtValue);
});

// ---------------------------------------------------------------------------
// When I fill in the following: (table by label)
// Captures: (pronounCase, theCase) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in( the)* following:$/, async function (pronounCase, theCase, table) {
  for (const [field, value] of table.raw()) {
    await fillField(this.page, field, value);
  }
});

// ---------------------------------------------------------------------------
// When I fill in the following: by attr (table by attribute)
// Captures: (pronounCase, theCase, itsCase, attr, attrWord) = 5
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in( the)* following: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, theCase, itsCase, attr, attrWord, table) {
  for (const [attrValue, value] of table.raw()) {
    await this.page.locator(buildSelector(attrValue, attr)).first().fill(value);
  }
});

// ---------------------------------------------------------------------------
// When I select "Mercedes" from "Cars"
// Captures: (pronounCase, option, selectList) = 3
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// When I check "Remember me"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// When I uncheck "Remember me"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// When I select radio button "Male"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should be on homepage / frontpage
// Captures: (pronounCase, notCase, theCase, pageCase) = 4
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should be on "/user/login"
// Captures: (pronounCase, notCase, theCase, url, pageCase) = 5
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* be on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, notCase, theCase, url, pageCase) {
  const currentUrl = this.page.url();
  if (notCase) {
    assert.ok(!currentUrl.includes(url), `URL should NOT contain "${url}" but it is: ${currentUrl}`);
  } else {
    assert.ok(currentUrl.includes(url), `URL should contain "${url}" but it is: ${currentUrl}`);
  }
});

// ---------------------------------------------------------------------------
// Then the "Login" link should contain "/log-in"
// Captures: (theCase, element, url) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?"$/, async function (theCase, element, url) {
  const loc = this.page.getByText(element, { exact: true }).first();
  await loc.waitFor({ timeout: 5000 });
  const href = await loc.evaluate(el => el.href || el.getAttribute('href') || '');
  assert.ok(href.includes(url), `Expected link "${element}" href to contain "${url}" but got "${href}"`);
});

// ---------------------------------------------------------------------------
// Then the "#about-us-id" link should contain "about" by attr
// Captures: (theCase, attrValue, url, itsCase, attr, attrWord) = 6
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (theCase, attrValue, url, itsCase, attr, attrWord) {
  const loc = this.page.locator(buildSelector(attrValue, attr)).first();
  await loc.waitFor({ timeout: 5000 });
  const href = await loc.evaluate(el => el.href || el.getAttribute('href') || '');
  assert.ok(href.includes(url), `Expected element href to contain "${url}" but got "${href}"`);
});

// ---------------------------------------------------------------------------
// Then the response should contain "text"
// Captures: (theCase, notCase, expectedText) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*response should( not)* contain "([^"]*)?"$/, async function (theCase, notCase, expectedText) {
  const text = await this.page.locator('html').textContent() || '';
  if (notCase) {
    assert.ok(!text.includes(expectedText), `Response should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(text.includes(expectedText), `Response should contain "${expectedText}" but it does not.`);
  }
});

// ---------------------------------------------------------------------------
// Then I should see "John Smith" in the "Username" element
// Captures: (pronounCase, notCase, expectedText, theCase, element) = 5
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should see "John Smith" in the "uname" element by attr
// Captures: (pronounCase, notCase, expectedText, theCase, attrValue, itsCase, attr, attrWord) = 8
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should see a "Username" element
// Captures: (pronounCase, notCase, aAnCase, element) = 4
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should see a "uname" element by attr
// Captures: (pronounCase, notCase, aAnCase, attrValue, itsCase, attr, attrWord) = 7
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, notCase, aAnCase, attrValue, itsCase, attr, attrWord) {
  const loc = this.page.locator(buildSelector(attrValue, attr));
  if (notCase) {
    assert.strictEqual(await loc.count(), 0, `Element should NOT be present but it is.`);
  } else {
    await loc.first().waitFor({ state: 'visible', timeout: 3000 });
  }
});

// ---------------------------------------------------------------------------
// Then the "body" element should contain "color:white;"
// Captures: (theCase, selectorRaw, notCase, elementCss) = 4
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then the "Username" field should contain "John Smith"
// Captures: (theCase, field, notCase, expectedText) = 4
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then the "#PrivacyPolicy" checkbox should be checked
// Captures: (theCase, checkbox, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" checkbox should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the "#rememberMe" checkbox is checked
// Captures: (theCase, checkbox, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" checkbox is( not)* checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the checkbox "#PrivacyPolicy" should be checked
// Captures: (theCase, checkbox, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*checkbox "([^"]*)?" should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the checkbox "#rememberMe" is checked
// Captures: (theCase, checkbox, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*checkbox "([^"]*)?" is( not)* checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assert.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the radio button "#gender-male" should be selected
// Captures: (theCase, radioButton, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*radio button "([^"]*)?" should( not)* be selected$/, async function (theCase, radioButton, notCase) {
  const isChecked = await this.page.locator(radioButton).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assert.ok(isChecked, `Radio button "${radioButton}" should be selected but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the radio button with value "male" should be selected
// Captures: (theCase, radioValue, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*radio button with value "([^"]*)?" should( not)* be selected$/, async function (theCase, radioValue, notCase) {
  const isChecked = await this.page.locator(`input[type="radio"][value="${radioValue}"]`).first().isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Radio button with value "${radioValue}" should NOT be selected but it is.`);
  } else {
    assert.ok(isChecked, `Radio button with value "${radioValue}" should be selected but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the "#gender-male" radio button is selected
// Captures: (theCase, radioButton, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" radio button is( not)* selected$/, async function (theCase, radioButton, notCase) {
  const isChecked = await this.page.locator(radioButton).isChecked();
  if (notCase) {
    assert.ok(!isChecked, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assert.ok(isChecked, `Radio button "${radioButton}" should be selected but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the response status code should be 200
// Captures: (theCase, notCase, expectedStatusCode) = 3
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then I should see text matching "^T\w+"
// Captures: (pronounCase, notCase, textPattern) = 3
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see text matching "([^"]*)?"$/, async function (pronounCase, notCase, textPattern) {
  const bodyText = await this.page.evaluate(() => document.body.innerText || '');
  const regex = new RegExp(textPattern);
  if (notCase) {
    assert.ok(!regex.test(bodyText), `Page text should NOT match "${textPattern}" but it does.`);
  } else {
    assert.ok(regex.test(bodyText), `Page text should match "${textPattern}" but it does not.`);
  }
});

// ---------------------------------------------------------------------------
// Then I should see text matching "..." in the "#date" element
// Captures: (pronounCase, notCase, textPattern, theCase, element) = 5
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Then the url should match "/contact-us.html"
// Captures: (theCase, notCase, pattern) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*url should( not)* match "([^"]*)?"$/, async function (theCase, notCase, pattern) {
  const currentUrl = this.page.url();
  const regex = new RegExp(pattern);
  if (notCase) {
    assert.ok(!regex.test(currentUrl), `URL "${currentUrl}" should NOT match "${pattern}" but it does.`);
  } else {
    assert.ok(regex.test(currentUrl), `URL "${currentUrl}" should match "${pattern}" but it does not.`);
  }
});

// ---------------------------------------------------------------------------
// When I attach the file "profileIcon.jpg" to "#profile-icon-upload"
// Captures: (pronounCase, theCase, fileName, element) = 4
// ---------------------------------------------------------------------------
When(/^(I |we )*attach( the)* file "([^"]*)?" to "([^"]*)?"$/, async function (pronounCase, theCase, fileName, element) {
  await this.page.locator(element).setInputFiles(path.resolve(this.assetsFolder, fileName));
});

// ---------------------------------------------------------------------------
// When I wait 1 second / 5 seconds
// Captures: (pronounCase, number, withSecondWord) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*wait (\d*)( second| seconds|s)?$/, async function (pronounCase, number, withSecondWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000);
});

// ---------------------------------------------------------------------------
// When I wait max of 5 seconds
// Captures: (pronounCase, number, withSecondWord) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*wait max of (\d*)( second| seconds|s)?$/, async function (pronounCase, number, withSecondWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000);
});

// ---------------------------------------------------------------------------
// When I wait 1 minute
// Captures: (pronounCase, number, withMinuteWord) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*wait (\d*)( minute| minutes|m)?$/, async function (pronounCase, number, withMinuteWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000 * 60);
});

// ---------------------------------------------------------------------------
// When I wait max of 1 minute
// Captures: (pronounCase, number, withMinuteWord) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*wait max of (\d*)( minute| minutes|m)?$/, async function (pronounCase, number, withMinuteWord) {
  await this.page.waitForTimeout(parseInt(number) * 1000 * 60);
});

// ---------------------------------------------------------------------------
// When I wait until the page is loaded
// Captures: (pronounCase, theCase, withIs) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*wait until( the)* page( is)* loaded*$/, async function (pronounCase, theCase, withIs) {
  await waitForPageLoad(this.page, 10000);
});

// ---------------------------------------------------------------------------
// When I wait for AJAX to finish
// Captures: (pronounCase) = 1
// ---------------------------------------------------------------------------
When(/^(I |we )*wait for AJAX to finish$/, async function (pronounCase) {
  await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
});

// ---------------------------------------------------------------------------
// Scroll steps
// ---------------------------------------------------------------------------
When(/^(I scroll|we scroll|scrolling)? down(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(0, v), numValue ? parseInt(numValue, 10) : 350);
});

When(/^(I scroll|we scroll|scrolling)? up(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(0, -v), numValue ? parseInt(numValue, 10) : 350);
});

When(/^(I scroll|we scroll|scrolling)? to( the)* top( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(0, 0));
});

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

When(/^(I scroll|we scroll|scrolling)? to top of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => {
    el.scrollTop = 0;
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
});

When(/^(I scroll|we scroll|scrolling)? to bottom of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
});

When(/^(I scroll|we scroll|scrolling)? right(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(v, 0), numValue ? parseInt(numValue, 10) : 350);
});

When(/^(I scroll|we scroll|scrolling)? left(?: (\d+))?$/, async function (pronounCase, numValue) {
  await this.page.evaluate((v) => window.scrollBy(-v, 0), numValue ? parseInt(numValue, 10) : 350);
});

When(/^(I scroll|we scroll|scrolling)? to( the)* start( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(0, window.scrollY));
});

When(/^(I scroll|we scroll|scrolling)? to( the)* end( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(document.body.scrollWidth, window.scrollY));
});

When(/^(I scroll|we scroll|scrolling)? to start of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => { el.scrollLeft = 0; });
});

When(/^(I scroll|we scroll|scrolling)? to end of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.locator(selector).evaluate(el => { el.scrollLeft = el.scrollWidth; });
});

// ---------------------------------------------------------------------------
// Modal steps
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see (a |the )*modal( dialog)*$/, async function (pronounCase, notCase, aTheCase, dialogCase) {
  const visible = await isAnyModalVisible(this.page);
  if (notCase) {
    assert.ok(!visible, 'Modal dialog is visible, but it should not be.');
  } else {
    assert.ok(visible, 'Modal dialog is not visible, but it should be.');
  }
});

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

Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* modal( dialog)*$/, async function (pronounCase, notCase, expectedText, theCase, dialogCase) {
  const found = await this.page.locator(MODAL_SELECTOR).filter({ hasText: expectedText }).count() > 0;
  if (notCase) {
    assert.ok(!found, `Found "${expectedText}" in modal, but it should not be there.`);
  } else {
    assert.ok(found, `Could not find "${expectedText}" in modal.`);
  }
});

When(/^(I |we )*click "([^"]*)?"( button)* in( the)* modal( dialog)*$/, async function (pronounCase, buttonText, buttonCase, theCase, dialogCase) {
  await waitForModalState(this.page, 'visible', 10000);
  const modal = await findVisibleModal(this.page);
  await modal.locator('button, a, [role="button"], input[type="button"], input[type="submit"], .btn')
    .filter({ hasText: buttonText })
    .first()
    .click();
});

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

When(/^(I |we )*wait for( the)* modal( dialog)* to (appear|disappear)$/, async function (pronounCase, theCase, dialogCase, appearOrDisappear) {
  const state = appearOrDisappear === 'appear' ? 'visible' : 'hidden';
  await waitForModalState(this.page, state, 10000);
});
