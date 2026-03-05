'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const axios = require('axios');
const path = require('path');

// ---------------------------------------------------------------------------
// Helper: build CSS selector from attrValue + optional attr argument.
// Mirrors the original step definition selector logic.
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
// Helper: wait for page readyState === 'complete'
// ---------------------------------------------------------------------------
async function waitForPageLoad(page, timeout) {
  await page.waitForLoadState('domcontentloaded', { timeout: timeout || 10000 });
}

// ---------------------------------------------------------------------------
// Given I am on homepage / frontpage
// Captures: (pronounCase, theCase, pageCase) = 3
// ---------------------------------------------------------------------------
Given(/^(I am |we are )?on( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await this.page.goto(this.launchUrl);
  await this.page.waitForSelector('body', { timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// Given I am on "/about-us.html"
// Captures: (pronounCase, theCase, url, pageCase) = 4
// ---------------------------------------------------------------------------
Given(/^(I am |we are )*on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, theCase, url, pageCase) {
  await this.page.goto(this.launchUrl + url);
  await this.page.waitForSelector('body', { timeout: 10000 });
  await waitForPageLoad(this.page);
});

// ---------------------------------------------------------------------------
// When I go to homepage / frontpage
// Captures: (pronounCase, theCase, pageCase) = 3
// ---------------------------------------------------------------------------
When(/^(I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await this.page.goto(this.launchUrl);
  await this.page.waitForSelector('body', { timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// When I go to "/contact-us.html"
// Captures: (pronounCase, url) = 2
// ---------------------------------------------------------------------------
When(/^(I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$/, async function (pronounCase, url) {
  const defaultTime = this.minWaitTime.page || 3000;
  await this.page.goto(this.launchUrl + url);
  await this.page.waitForSelector('body', { timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// Then I should see "text" / Then I should not see "text"
// Captures: (pronounCase, notCase, expectedText) = 3
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see "([^"]*)?"$/, async function (pronounCase, notCase, expectedText) {
  if (notCase) {
    const bodyText = await this.page.evaluate(() => document.body.innerText || '');
    assert.ok(!bodyText.includes(expectedText), `Page should NOT contain "${expectedText}" but it does.`);
  } else {
    try {
      await this.page.waitForFunction(
        (text) => (document.body.innerText || '').includes(text),
        expectedText,
        { timeout: 5000 }
      );
    } catch (_) {
      const bodyText = await this.page.evaluate(() => document.body.innerText || '');
      assert.ok(bodyText.includes(expectedText), `Page should contain "${expectedText}" but it does not.`);
    }
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
  const locator = this.page.locator(
    'button, input[type="button"], input[type="submit"], [role="button"], .btn, a'
  ).filter({ hasText: new RegExp('^' + element.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') });

  try {
    await locator.first().waitFor({ state: 'visible', timeout: 10000 });
    await locator.first().click();
  } catch {
    // Fallback: JS click approach for dynamically generated buttons
    const found = await this.page.evaluate((buttonText) => {
      const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"], .btn, a');
      for (const btn of buttons) {
        const text = (btn.textContent || btn.innerText || btn.value || '').trim();
        if (text === buttonText) {
          btn.click();
          return true;
        }
      }
      return false;
    }, element);
    assert.ok(found, `Button "${element}" was not found`);
  }
});

// ---------------------------------------------------------------------------
// When I press "btn-pressid" by attr / attribute
// Captures: (pronounCase, attrValue, itsCase, attr, attrWord) = 5
// Pattern: (I |we )* press "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)
// Note: outer group made non-capturing so inner ([^"]*) is direct root child
// ---------------------------------------------------------------------------
When(/^(I |we )*press "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 10000 });
  await this.page.click(selector);
});

// ---------------------------------------------------------------------------
// When I click "Contact Us"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*click "([^"]*)?"$/, async function (pronounCase, item) {
  const locator = this.page.locator(
    'a, button, [role="button"], .btn, input[type="button"], input[type="submit"]'
  ).filter({ hasText: new RegExp('^' + item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') });

  try {
    await locator.first().waitFor({ state: 'visible', timeout: 10000 });
    await locator.first().click();
  } catch {
    // Fallback JS click
    const found = await this.page.evaluate((linkText) => {
      const clickables = document.querySelectorAll('a, button, [role="button"], .btn, input[type="button"], input[type="submit"]');
      for (const el of clickables) {
        const text = (el.textContent || el.innerText || el.value || '').trim();
        if (text === linkText) {
          el.click();
          return true;
        }
      }
      return false;
    }, item);
    assert.ok(found, `Link/Button "${item}" was not found`);
  }
});

// ---------------------------------------------------------------------------
// When I click "#about-us-id" by attr / attribute
// Captures: (pronounCase, attrValue, itsCase, attr, attrWord) = 5
// ---------------------------------------------------------------------------
When(/^(I |we )*click "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 10000 });
  await this.page.click(selector);
});

// ---------------------------------------------------------------------------
// When I click "Edit" in the "John Smith" row
// Captures: (pronounCase, clickText, theCase, rowIdentifier) = 4
// Pattern: (I |we )* click "([^"]*)?" in( the)* "([^"]*)?" row
// Wait - let me recount: (I |we )* = 1, "([^"]*)?" = 2, in( the)* = 3 NO theCase doesn't have ()
// Actually: (I |we )* click "([^"]*)?" in( the)* "([^"]*)?" row
// Group 1: (I |we )*  Group 2: ([^"]*)  Group 3: ( the)*  Group 4: ([^"]*)
// = 4 captures
// ---------------------------------------------------------------------------
When(/^(I |we )*click "([^"]*)?" in( the)* "([^"]*)?" row$/, async function (pronounCase, clickText, theCase, rowIdentifier) {
  const result = await this.page.evaluate(({ rowId, targetText }) => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return { success: false, error: 'No tables found' };

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const rowText = row.textContent || '';
        if (rowText.includes(rowId)) {
          const clickables = row.querySelectorAll('a, button, [onclick], [role="button"], .btn, input[type="submit"], input[type="button"]');
          for (const el of clickables) {
            const elText = (el.textContent || el.innerText || el.value || '').trim();
            if (elText === targetText) {
              el.click();
              return { success: true };
            }
          }
          // Try all elements
          for (const el of row.querySelectorAll('*')) {
            const elText = (el.textContent || el.innerText || '').trim();
            if (elText === targetText) {
              el.click();
              return { success: true };
            }
          }
          return { success: false, error: `Row found but "${targetText}" not clickable in it` };
        }
      }
    }
    return { success: false, error: `Row containing "${rowId}" not found` };
  }, { rowId: rowIdentifier, targetText: clickText });

  assert.ok(result.success, result.error || `Could not click "${clickText}" in the "${rowIdentifier}" row`);
});

// ---------------------------------------------------------------------------
// Then I should see "Active" in the "John Smith" row
// Captures: (pronounCase, notCase, expectedText, theCase, rowIdentifier) = 5
// Pattern: (I |we )* should( not)* see "([^"]*)?" in( the)* "([^"]*)?" row
// = 5 captures
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" row$/, async function (pronounCase, notCase, expectedText, theCase, rowIdentifier) {
  const found = await this.page.evaluate(({ rowId, expected }) => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) throw new Error('No tables found on the page');
    for (const table of tables) {
      for (const row of table.querySelectorAll('tr')) {
        const rowText = row.textContent || '';
        if (rowText.includes(rowId) && rowText.includes(expected)) return true;
      }
    }
    return false;
  }, { rowId: rowIdentifier, expected: expectedText });

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
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filled = await this.page.evaluate(({ fieldText, val }) => {
    const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent.trim() === fieldText);
    let el = null;
    if (label && label.htmlFor) {
      el = document.getElementById(label.htmlFor);
    }
    if (!el && label) {
      el = label.nextElementSibling;
      if (el && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') el = null;
    }
    if (!el && label) {
      const p = label.closest('p, div, td, li');
      if (p) { el = p.nextElementSibling && p.nextElementSibling.querySelector('input, textarea'); }
    }
    if (!el) {
      el = document.querySelector(`[placeholder="${fieldText}"], [name="${fieldText}"], #${CSS.escape(fieldText)}`);
    }
    if (!el) return false;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, { fieldText: field, val: value });
  if (!filled) {
    // Fallback to Playwright fill
    const labelEl = this.page.locator('label').filter({ hasText: new RegExp('^' + escaped + '$') }).first();
    const forAttr = await labelEl.getAttribute('for').catch(() => null);
    if (forAttr) {
      await this.page.waitForSelector('#' + forAttr, { timeout: 5000 });
      await this.page.fill('#' + forAttr, value);
    }
  }
});

// ---------------------------------------------------------------------------
// When I fill in "uname" with "John Smith" by attr
// Captures: (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) = 6
// Pattern: (I |we )* fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.fill(selector, txtValue);
});

// ---------------------------------------------------------------------------
// When I fill in "Username" with: (empty)
// Captures: (pronounCase, field) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with:$/, async function (pronounCase, field) {
  const labelEl = this.page.getByText(field, { exact: true });
  const forAttr = await labelEl.getAttribute('for');
  if (forAttr) {
    await this.page.waitForSelector('#' + forAttr, { timeout: 5000 });
    await this.page.fill('#' + forAttr, '');
  } else {
    const input = this.page.locator('label').filter({ hasText: new RegExp('^' + field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).locator('~ input, + input').first();
    await input.fill('');
  }
});

// ---------------------------------------------------------------------------
// When I fill in "uname" with: by attr (empty by attr)
// Captures: (pronounCase, attrValue, itsCase, attr, attrWord) = 5
// Pattern: (I |we )* fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.fill(selector, '');
});

// ---------------------------------------------------------------------------
// When I fill in "John Smith" for "Username"
// Captures: (pronounCase, value, field) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, async function (pronounCase, value, field) {
  const labelEl = this.page.getByText(field, { exact: true });
  const forAttr = await labelEl.getAttribute('for');
  if (forAttr) {
    await this.page.waitForSelector('#' + forAttr, { timeout: 5000 });
    await this.page.fill('#' + forAttr, value);
  } else {
    const input = this.page.locator('label').filter({ hasText: new RegExp('^' + field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).locator('~ input, + input').first();
    await input.fill(value);
  }
});

// ---------------------------------------------------------------------------
// When I fill in "John Smith" for "uname" by attr
// Captures: (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) = 6
// Pattern: (I |we )* fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.fill(selector, txtValue);
});

// ---------------------------------------------------------------------------
// When I fill in the following: (table by label)
// Captures: (pronounCase, theCase) = 2; table is passed as extra arg
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in( the)* following:$/, async function (pronounCase, theCase, table) {
  const rows = table.raw();
  for (const row of rows) {
    const field = row[0], value = row[1];
    const labelLocator = this.page.getByLabel(field, { exact: true });
    if (await labelLocator.count() > 0) {
      await labelLocator.fill(value);
    } else {
      const loc = this.page.locator(`[placeholder="${field}"]`);
      if (await loc.count() > 0) {
        await loc.first().fill(value);
      } else {
        await this.page.locator(`[name="${field}"]`).first().fill(value);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// When I fill in the following: by attr (table by attribute)
// Captures: (pronounCase, theCase, itsCase, attr, attrWord) = 5; table is extra arg
// Pattern: (I |we )* fill in( the)* following: by( its)*(?: "([^"]*)?")* (attribute|attr)
// ---------------------------------------------------------------------------
When(/^(I |we )*fill in( the)* following: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, theCase, itsCase, attr, attrWord, table) {
  const rows = table.raw();
  for (const row of rows) {
    const sel = buildSelector(row[0], attr), value = row[1];
    await this.page.waitForSelector(sel, { timeout: 5000 });
    await this.page.fill(sel, value);
  }
});

// ---------------------------------------------------------------------------
// When I select "Mercedes" from "Cars"
// Captures: (pronounCase, option, selectList) = 3
// ---------------------------------------------------------------------------
When(/^(I |we )*select "([^"]*)?" from "([^"]*)?"$/, async function (pronounCase, option, selectList) {
  let selector;
  const hasASpace = selectList.indexOf(' ');
  if (selectList.startsWith('#') || selectList.startsWith('.')) {
    selector = selectList;
  } else if (hasASpace === -1) {
    selector = '[name="' + selectList + '"],[id="' + selectList + '"],[class="' + selectList + '"]';
  } else {
    const labelEl = this.page.getByText(selectList, { exact: true });
    const forAttr = await labelEl.getAttribute('for');
    selector = forAttr ? '#' + forAttr : null;
  }

  if (selector) {
    await this.page.waitForSelector(selector, { timeout: 10000 });
    const handled = await this.page.evaluate(({ sel, opt }) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const optLower = opt.toLowerCase();
      for (const o of el.options) {
        if (o.value.toLowerCase() === optLower || o.text.toLowerCase() === optLower) {
          el.value = o.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, { sel: selector, opt: option });
    assert.ok(handled, `Could not find option "${option}" in select "${selectList}"`);
  } else {
    assert.fail(`Could not find select element for "${selectList}"`);
  }
});

// ---------------------------------------------------------------------------
// When I check "Remember me"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*check "([^"]*)?"$/, async function (pronounCase, item) {
  const found = await this.page.evaluate((checkboxItem) => {
    function check(el) {
      if (!el) return false;
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    if (checkboxItem.startsWith('#') || checkboxItem.startsWith('.')) {
      return check(document.querySelector(checkboxItem));
    }
    // By id, name, or value
    const byAttr = document.querySelector(
      `input[type="checkbox"][id="${checkboxItem}"],input[type="checkbox"][name="${checkboxItem}"],input[type="checkbox"][value="${checkboxItem}"]`
    );
    if (byAttr) return check(byAttr);
    // By label text
    for (const label of document.querySelectorAll('label')) {
      const text = (label.textContent || label.innerText || '').trim();
      if (text === checkboxItem) {
        const forAttr = label.getAttribute('for');
        if (forAttr) return check(document.getElementById(forAttr));
        const nested = label.querySelector('input[type="checkbox"]');
        if (nested) return check(nested);
      }
    }
    return false;
  }, item);
  assert.ok(found, `Checkbox "${item}" was not found`);
});

// ---------------------------------------------------------------------------
// When I uncheck "Remember me"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*uncheck "([^"]*)?"$/, async function (pronounCase, item) {
  const found = await this.page.evaluate((checkboxItem) => {
    function uncheck(el) {
      if (!el) return false;
      el.checked = false;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    if (checkboxItem.startsWith('#') || checkboxItem.startsWith('.')) {
      return uncheck(document.querySelector(checkboxItem));
    }
    // By id, name, or value
    const byAttr = document.querySelector(
      `input[type="checkbox"][id="${checkboxItem}"],input[type="checkbox"][name="${checkboxItem}"],input[type="checkbox"][value="${checkboxItem}"]`
    );
    if (byAttr) return uncheck(byAttr);
    // By label text
    for (const label of document.querySelectorAll('label')) {
      const text = (label.textContent || label.innerText || '').trim();
      if (text === checkboxItem) {
        const forAttr = label.getAttribute('for');
        if (forAttr) return uncheck(document.getElementById(forAttr));
        const nested = label.querySelector('input[type="checkbox"]');
        if (nested) return uncheck(nested);
      }
    }
    return false;
  }, item);
  assert.ok(found, `Checkbox "${item}" was not found`);
});

// ---------------------------------------------------------------------------
// When I select radio button "Male"
// Captures: (pronounCase, item) = 2
// ---------------------------------------------------------------------------
When(/^(I |we )*select radio button "([^"]*)?"$/, async function (pronounCase, item) {
  const found = await this.page.evaluate((radioItem) => {
    if (radioItem.startsWith('#') || radioItem.startsWith('.')) {
      const el = document.querySelector(radioItem);
      if (el && el.type === 'radio') {
        el.checked = true;
        el.dispatchEvent(new Event('click', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }
    // By value
    for (const rb of document.querySelectorAll('input[type="radio"]')) {
      if (rb.value === radioItem) {
        rb.checked = true;
        rb.dispatchEvent(new Event('click', { bubbles: true }));
        rb.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    // By label
    for (const label of document.querySelectorAll('label')) {
      const text = (label.textContent || label.innerText || '').trim();
      if (text === radioItem) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          const el = document.getElementById(forAttr);
          if (el && el.type === 'radio') {
            el.checked = true;
            el.dispatchEvent(new Event('click', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        const radioInput = label.querySelector('input[type="radio"]');
        if (radioInput) {
          radioInput.checked = true;
          radioInput.dispatchEvent(new Event('click', { bubbles: true }));
          radioInput.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }, item);
  assert.ok(found, `Radio button "${item}" was not found`);
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
  const el = this.page.getByText(element, { exact: true });
  await el.waitFor({ timeout: 5000 });
  const href = await el.evaluate((node) => node.href || node.getAttribute('href') || '');
  assert.ok(href && href.includes(url), `Expected link "${element}" href to contain "${url}" but got "${href}"`);
});

// ---------------------------------------------------------------------------
// Then the "#about-us-id" link should contain "about" by attr
// Captures: (theCase, attrValue, url, itsCase, attrQuote, attr, attrWord) = 7
// Pattern: (the )* "([^"]*)?" link should contain "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)
// Groups: 1=theCase, 2=attrValue, 3=url, 4=itsCase, 5=attr, 6=attrWord
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (theCase, attrValue, url, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 5000 });
  const href = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? (el.href || el.getAttribute('href') || '') : '';
  }, selector);
  assert.ok(href && href.includes(url), `Expected element "${selector}" href to contain "${url}" but got "${href}"`);
});

// ---------------------------------------------------------------------------
// Then the response should contain "text"
// Captures: (theCase, notCase, expectedText) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*response should( not)* contain "([^"]*)?"$/, async function (theCase, notCase, expectedText) {
  const bodyText = await this.page.evaluate(() => document.documentElement.textContent || '');
  if (notCase) {
    assert.ok(!bodyText.includes(expectedText), `Response should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(bodyText.includes(expectedText), `Response should contain "${expectedText}" but it does not.`);
  }
});

// ---------------------------------------------------------------------------
// Then I should see "John Smith" in the "Username" element
// Captures: (pronounCase, notCase, expectedText, theCase, element) = 5
// Pattern: (I |we )* should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element
// Groups: 1, 2, 3, 4=theCase, 5=element
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element$/, async function (pronounCase, notCase, expectedText, theCase, element) {
  const labelEl = this.page.getByText(element, { exact: true });
  const forAttr = await labelEl.getAttribute('for');
  const selector = forAttr ? '#' + forAttr : element;
  await this.page.waitForSelector(selector, { timeout: 5000 });
  if (notCase) {
    const content = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return el.textContent || el.innerText || el.value || '';
    }, selector);
    assert.ok(content !== null, `Element "${selector}" not found`);
    assert.ok(!content.includes(expectedText), `Element should NOT contain "${expectedText}" but it does.`);
  } else {
    try {
      await this.page.waitForFunction(({ sel, text }) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        return (el.textContent || el.innerText || el.value || '').includes(text);
      }, { sel: selector, text: expectedText }, { timeout: 5000 });
    } catch (_) {
      const content = await this.page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        return el.textContent || el.innerText || el.value || '';
      }, selector);
      assert.ok(content !== null, `Element "${selector}" not found`);
      assert.ok(content.includes(expectedText), `Element should contain "${expectedText}" but it does not.`);
    }
  }
});

// ---------------------------------------------------------------------------
// Then I should see "John Smith" in the "uname" element by attr
// Captures: (pronounCase, notCase, expectedText, theCase, attrValue, itsCase, attrQuote, attr, attrWord) = 9
// Pattern: (I |we )* should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)
// Groups: 1, 2, 3, 4, 5=attrValue, 6=itsCase, 7=attr, 8=attrWord
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, notCase, expectedText, theCase, attrValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  await this.page.waitForSelector(selector, { timeout: 10000 });
  if (notCase) {
    const content = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return el.textContent || el.innerText || el.value || '';
    }, selector);
    assert.ok(content !== null, `Element "${selector}" not found`);
    assert.ok(!content.includes(expectedText), `Element should NOT contain "${expectedText}" but it does.`);
  } else {
    try {
      await this.page.waitForFunction(({ sel, text }) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        return (el.textContent || el.innerText || el.value || '').includes(text);
      }, { sel: selector, text: expectedText }, { timeout: 5000 });
    } catch (_) {
      const content = await this.page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        return el.textContent || el.innerText || el.value || '';
      }, selector);
      assert.ok(content !== null, `Element "${selector}" not found`);
      assert.ok(content.includes(expectedText), `Element should contain "${expectedText}" but it does not.`);
    }
  }
});

// ---------------------------------------------------------------------------
// Then I should see a "Username" element
// Captures: (pronounCase, notCase, aAnCase, element) = 4
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element$/, async function (pronounCase, notCase, aAnCase, element) {
  if (notCase) {
    const bodyText = await this.page.evaluate(() => document.documentElement.innerText || document.documentElement.textContent);
    assert.ok(!bodyText.includes(element), `Page should NOT contain element text "${element}" but it does.`);
  } else {
    const labelEl = this.page.getByText(element, { exact: true });
    const forAttr = await labelEl.getAttribute('for');
    if (forAttr) {
      await this.page.waitForSelector('#' + forAttr, { timeout: 3000 });
      const visible = await this.page.isVisible('#' + forAttr);
      assert.ok(visible, `Element "#${forAttr}" should be visible but is not.`);
    } else {
      const visible = await labelEl.isVisible();
      assert.ok(visible, `Element with text "${element}" should be visible but is not.`);
    }
  }
});

// ---------------------------------------------------------------------------
// Then I should see a "uname" element by attr
// Captures: (pronounCase, notCase, aAnCase, attrValue, itsCase, attrQuote, attr, attrWord) = 8
// Pattern: (I |we )* should( not)* see (a|an) "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)
// Groups: 1, 2, 3, 4=attrValue, 5=itsCase, 6=attr, 7=attrWord
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, notCase, aAnCase, attrValue, itsCase, attr, attrWord) {
  const selector = buildSelector(attrValue, attr);
  if (notCase) {
    const present = await this.page.locator(selector).count();
    assert.strictEqual(present, 0, `Element "${selector}" should NOT be present but it is.`);
  } else {
    await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
    const visible = await this.page.isVisible(selector);
    assert.ok(visible, `Element "${selector}" should be visible but is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the "body" element should contain "color:white;"
// Captures: (theCase, selector, notCase, elementCss) = 4
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" element should( not)* contain "([^"]*)?"$/, async function (theCase, selectorRaw, notCase, elementCss) {
  const selector = buildSelector(selectorRaw);
  const cssClean = elementCss.replace(/;$/, '');
  const colonIdx = cssClean.indexOf(':');
  const cssProperty = cssClean.substring(0, colonIdx).trim();
  const expectedValue = cssClean.substring(colonIdx + 1).trim();

  await this.page.waitForSelector(selector, { timeout: 10000 });
  const matches = await this.page.evaluate(({ sel, prop, expectedVal }) => {
    const el = document.querySelector(sel);
    if (!el) return null;

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

    function isValidColor(value) {
      const result = colorToRgb(value);
      return result !== 'rgb(1, 2, 3)';
    }

    function normalizeColorTokens(value) {
      return value.replace(/rgb\([^)]+\)|rgba\([^)]+\)|#[0-9a-fA-F]+|\b[a-zA-Z]+\b/g, (token) => {
        if (isValidColor(token)) return colorToRgb(token);
        return token;
      });
    }

    function tokenize(value) {
      const tokens = [];
      const regex = /rgb\([^)]+\)|rgba\([^)]+\)|[^\s]+/g;
      let m;
      while ((m = regex.exec(value)) !== null) tokens.push(m[0]);
      return tokens;
    }

    const computed = window.getComputedStyle(el).getPropertyValue(prop).trim();

    const normalizedExpected = normalizeColorTokens(expectedVal.toLowerCase());
    const normalizedComputed = normalizeColorTokens(computed.toLowerCase());

    const expectedTokens = tokenize(normalizedExpected);
    const allMatch = expectedTokens.every(token => normalizedComputed.includes(token));

    return allMatch;
  }, { sel: selector, prop: cssProperty, expectedVal: expectedValue });

  assert.ok(matches !== null, `Element "${selector}" was not found`);
  if (notCase) {
    assert.ok(!matches, `Element "${selector}" should NOT have CSS "${cssProperty}: ${expectedValue}" but it does.`);
  } else {
    assert.ok(matches, `Element "${selector}" should have CSS "${cssProperty}: ${expectedValue}".`);
  }
});

// ---------------------------------------------------------------------------
// Then the "Username" field should contain "John Smith"
// Captures: (theCase, field, notCase, expectedText) = 4
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" field should( not)* contain "([^"]*)?"$/, async function (theCase, field, notCase, expectedText) {
  let selector = field;
  if (!field.startsWith('#') && !field.startsWith('.')) {
    try {
      const labelEl = this.page.getByText(field, { exact: true });
      const forAttr = await labelEl.getAttribute('for');
      if (forAttr) selector = '#' + forAttr;
    } catch (_) { /* use field as selector */ }
  }
  await this.page.waitForSelector(selector, { timeout: 5000 });
  const content = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return el.textContent || el.innerText || el.value || '';
  }, selector);
  if (notCase) {
    assert.ok(!content.includes(expectedText), `Field "${selector}" should NOT contain "${expectedText}" but it does.`);
  } else {
    assert.ok(content.includes(expectedText), `Field "${selector}" should contain "${expectedText}" but it does not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the "#PrivacyPolicy" checkbox should be checked
// Captures: (theCase, checkbox, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" checkbox should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  await this.page.waitForSelector(checkbox, { timeout: 10000 });
  const isChecked = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.checked : null;
  }, checkbox);
  assert.ok(isChecked !== null, `Checkbox "${checkbox}" was not found`);
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
  await this.page.waitForSelector(checkbox, { timeout: 5000 });
  const isChecked = await this.page.isChecked(checkbox);
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
  await this.page.waitForSelector(checkbox, { timeout: 10000 });
  const isChecked = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.checked : null;
  }, checkbox);
  assert.ok(isChecked !== null, `Checkbox "${checkbox}" was not found`);
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
  await this.page.waitForSelector(checkbox, { timeout: 10000 });
  const isChecked = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.checked : null;
  }, checkbox);
  assert.ok(isChecked !== null, `Checkbox "${checkbox}" was not found`);
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
  await this.page.waitForSelector(radioButton, { timeout: 10000 });
  const isSelected = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el && el.type === 'radio' ? el.checked : null;
  }, radioButton);
  assert.ok(isSelected !== null, `Radio button "${radioButton}" was not found`);
  if (notCase) {
    assert.ok(!isSelected, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assert.ok(isSelected, `Radio button "${radioButton}" should be selected but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the radio button with value "male" should be selected
// Captures: (theCase, radioValue, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*radio button with value "([^"]*)?" should( not)* be selected$/, async function (theCase, radioValue, notCase) {
  const isSelected = await this.page.evaluate((value) => {
    for (const rb of document.querySelectorAll('input[type="radio"]')) {
      if (rb.value === value) return rb.checked;
    }
    return null;
  }, radioValue);
  assert.ok(isSelected !== null, `Radio button with value "${radioValue}" was not found`);
  if (notCase) {
    assert.ok(!isSelected, `Radio button with value "${radioValue}" should NOT be selected but it is.`);
  } else {
    assert.ok(isSelected, `Radio button with value "${radioValue}" should be selected but it is not.`);
  }
});

// ---------------------------------------------------------------------------
// Then the "#gender-male" radio button is selected
// Captures: (theCase, radioButton, notCase) = 3
// ---------------------------------------------------------------------------
Then(/^(the )*"([^"]*)?" radio button is( not)* selected$/, async function (theCase, radioButton, notCase) {
  await this.page.waitForSelector(radioButton, { timeout: 5000 });
  const isChecked = await this.page.isChecked(radioButton);
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
  await this.page.waitForSelector('body', { timeout: 5000 });
  const bodyText = await this.page.evaluate(() => document.body.innerText || document.body.textContent || '');
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
// Pattern: (I |we )* should( not)* see text matching "([^"]*)?" in( the)* "([^"]*)?" element
// Groups: 1, 2, 3, 4=theCase, 5=element
// ---------------------------------------------------------------------------
Then(/^(I |we )*should( not)* see text matching "([^"]*)?" in( the)* "([^"]*)?" element$/, async function (pronounCase, notCase, textPattern, theCase, element) {
  await this.page.waitForSelector(element, { timeout: 5000 });
  const text = await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? (el.textContent || el.innerText || el.value || '') : '';
  }, element);
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
  await this.page.waitForSelector('body', { timeout: 5000 });
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
// Pattern: (I |we )* attach( the)* file "([^"]*)?" to "([^"]*)?"
// Groups: 1, 2=theCase, 3=fileName, 4=element
// ---------------------------------------------------------------------------
When(/^(I |we )*attach( the)* file "([^"]*)?" to "([^"]*)?"$/, async function (pronounCase, theCase, fileName, element) {
  const localFilePath = path.resolve(this.assetsFolder, fileName);
  await this.page.waitForSelector(element, { timeout: 5000 });
  await this.page.locator(element).setInputFiles(localFilePath);
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
  await this.page.waitForSelector('body', { timeout: 10000 });
  await waitForPageLoad(this.page, 10000);
});

// ---------------------------------------------------------------------------
// When I wait for AJAX to finish
// Captures: (pronounCase) = 1
// ---------------------------------------------------------------------------
When(/^(I |we )*wait for AJAX to finish$/, async function (pronounCase) {
  await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Not a failure if network isn't completely idle
  });
});

// ---------------------------------------------------------------------------
// Scroll steps
// ---------------------------------------------------------------------------
// When I scroll down / When I scroll down 800
// Captures: (pronounCase, numValue) = 2
// Pattern: (I scroll|we scroll|scrolling)? down(?: (\d+))?
// ---------------------------------------------------------------------------
When(/^(I scroll|we scroll|scrolling)? down(?: (\d+))?$/, async function (pronounCase, numValue) {
  const scrollValue = numValue ? parseInt(numValue, 10) : 350;
  await this.page.evaluate((v) => window.scrollBy(0, v), scrollValue);
});

When(/^(I scroll|we scroll|scrolling)? up(?: (\d+))?$/, async function (pronounCase, numValue) {
  const scrollValue = numValue ? parseInt(numValue, 10) : 350;
  await this.page.evaluate((v) => window.scrollBy(0, -v), scrollValue);
});

// Captures: (pronounCase, theCase, pageCase) = 3
When(/^(I scroll|we scroll|scrolling)? to( the)* top( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => { document.documentElement.scrollTop = 0; });
});

// Captures: (pronounCase, theCase, pageCase) = 3
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

// Captures: (pronounCase, selector) = 2
When(/^(I scroll|we scroll|scrolling)? to top of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.scrollTop = 0;
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    }
  }, selector);
});

// Captures: (pronounCase, selector) = 2
When(/^(I scroll|we scroll|scrolling)? to bottom of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    }
  }, selector);
});

When(/^(I scroll|we scroll|scrolling)? right(?: (\d+))?$/, async function (pronounCase, numValue) {
  const scrollValue = numValue ? parseInt(numValue, 10) : 350;
  await this.page.evaluate((v) => window.scrollBy(v, 0), scrollValue);
});

When(/^(I scroll|we scroll|scrolling)? left(?: (\d+))?$/, async function (pronounCase, numValue) {
  const scrollValue = numValue ? parseInt(numValue, 10) : 350;
  await this.page.evaluate((v) => window.scrollBy(-v, 0), scrollValue);
});

// Captures: (pronounCase, theCase, pageCase) = 3
When(/^(I scroll|we scroll|scrolling)? to( the)* start( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(0, window.scrollY));
});

// Captures: (pronounCase, theCase, pageCase) = 3
When(/^(I scroll|we scroll|scrolling)? to( the)* end( of the page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.evaluate(() => window.scrollTo(document.body.scrollWidth, window.scrollY));
});

// Captures: (pronounCase, selector) = 2
When(/^(I scroll|we scroll|scrolling)? to start of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollLeft = 0;
  }, selector);
});

// Captures: (pronounCase, selector) = 2
When(/^(I scroll|we scroll|scrolling)? to end of "([^"]*)"$/, async function (pronounCase, selector) {
  await this.page.waitForSelector(selector, { timeout: 5000 });
  await this.page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollLeft = el.scrollWidth;
  }, selector);
});

// ---------------------------------------------------------------------------
// Modal steps
// ---------------------------------------------------------------------------
// Captures: (pronounCase, notCase, aTheCase, dialogCase) = 4
// Pattern: (I |we )* should( not)* see (a |the )* modal( dialog)*
Then(/^(I |we )*should( not)* see (a |the )*modal( dialog)*$/, async function (pronounCase, notCase, aTheCase, dialogCase) {
  const modalSelectors = [
    '.modal',
    '.modal.show',
    '.modal.in',
    '[role="dialog"]',
    '.dialog',
    '.popup',
    '.overlay',
  ];
  const visible = await this.page.evaluate((selectors) => {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) return true;
      }
    }
    return false;
  }, modalSelectors);
  if (notCase) {
    assert.ok(!visible, 'Modal dialog is visible, but it should not be.');
  } else {
    assert.ok(visible, 'Modal dialog is not visible, but it should be.');
  }
});

// Captures: (pronounCase, notCase, aTheCase, title) = 4
// Pattern: (I |we )* should( not)* see (a |the )* modal with title "([^"]*)?"
Then(/^(I |we )*should( not)* see (a |the )*modal with title "([^"]*)?"$/, async function (pronounCase, notCase, aTheCase, title) {
  const found = await this.page.evaluate((searchTitle) => {
    for (const modal of document.querySelectorAll('[role="dialog"], .modal, .dialog, .popup')) {
      const rect = modal.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        const titleAttr = modal.getAttribute('title') || modal.getAttribute('aria-label') || '';
        const titleEl = modal.querySelector('.modal-title, .dialog-title, h1, h2, h3');
        const titleText = titleEl ? (titleEl.textContent || titleEl.innerText || '').trim() : '';
        if (titleAttr.includes(searchTitle) || titleText.includes(searchTitle)) return true;
      }
    }
    return false;
  }, title);
  if (notCase) {
    assert.ok(!found, `Modal with title "${title}" is visible, but it should not be.`);
  } else {
    assert.ok(found, `Modal with title "${title}" is not visible or not found.`);
  }
});

// Captures: (pronounCase, notCase, aTheCase, identifier) = 4
// Pattern: (I |we )* should( not)* see (a |the )* "([^"]*)?" modal
Then(/^(I |we )*should( not)* see (a |the )*"([^"]*)?" modal$/, async function (pronounCase, notCase, aTheCase, identifier) {
  const visible = await this.page.evaluate((searchId) => {
    let modal = null;
    if (searchId.startsWith('#') || searchId.startsWith('.')) {
      modal = document.querySelector(searchId);
    } else {
      modal = document.querySelector(`#${searchId}`) ||
              document.querySelector(`.${searchId}`) ||
              document.querySelector(`[data-modal="${searchId}"]`);
    }
    if (!modal) return false;
    const style = window.getComputedStyle(modal);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }, identifier);
  if (notCase) {
    assert.ok(!visible, `Modal "${identifier}" is visible, but it should not be.`);
  } else {
    assert.ok(visible, `Modal "${identifier}" is not visible or not found.`);
  }
});

// Captures: (pronounCase, notCase, expectedText, theCase, dialogCase) = 5
// Pattern: (I |we )* should( not)* see "([^"]*)?" in( the)* modal( dialog)*
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* modal( dialog)*$/, async function (pronounCase, notCase, expectedText, theCase, dialogCase) {
  const modalSelectors = [
    '.modal', '.modal.show', '.modal.in',
    '[role="dialog"]', '.dialog', '.popup',
  ];
  const found = await this.page.evaluate(({ selectors, text }) => {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          if ((el.textContent || el.innerText || '').includes(text)) return true;
        }
      }
    }
    return false;
  }, { selectors: modalSelectors, text: expectedText });
  if (notCase) {
    assert.ok(!found, `Found "${expectedText}" in modal, but it should not be there.`);
  } else {
    assert.ok(found, `Could not find "${expectedText}" in modal.`);
  }
});

// Captures: (pronounCase, buttonText, buttonCase, theCase, dialogCase) = 5
// Pattern: (I |we )* click "([^"]*)?"( button)* in( the)* modal( dialog)*
When(/^(I |we )*click "([^"]*)?"( button)* in( the)* modal( dialog)*$/, async function (pronounCase, buttonText, buttonCase, theCase, dialogCase) {
  const result = await this.page.evaluate(({ selectors, btnText }) => {
    for (const sel of selectors) {
      for (const modal of document.querySelectorAll(sel)) {
        const rect = modal.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          for (const el of modal.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"], .btn')) {
            const text = (el.textContent || el.innerText || el.value || '').trim();
            if (text === btnText || text.includes(btnText)) { el.click(); return { success: true }; }
          }
        }
      }
    }
    return { success: false, error: `Could not find "${btnText}" button in modal` };
  }, {
    selectors: ['.modal', '.modal.show', '.modal.in', '[role="dialog"]', '.dialog', '.popup'],
    btnText: buttonText,
  });
  assert.ok(result.success, result.error || `Could not click "${buttonText}" in modal`);
});

// Captures: (pronounCase, closeOrDismiss, theCase, dialogCase) = 4
// Pattern: (I |we )* (close|dismiss)( the)* modal( dialog)*
When(/^(I |we )*(close|dismiss)( the)* modal( dialog)*$/, async function (pronounCase, closeOrDismiss, theCase, dialogCase) {
  await this.page.evaluate(() => {
    const modalSelectors = ['.modal', '.modal.show', '.modal.in', '[role="dialog"]', '.dialog', '.popup'];
    for (const sel of modalSelectors) {
      for (const modal of document.querySelectorAll(sel)) {
        const rect = modal.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          for (const btn of modal.querySelectorAll('.close, .modal-close, [data-dismiss="modal"], [aria-label="Close"], .btn-close, button[class*="close"]')) {
            const btnRect = btn.getBoundingClientRect();
            if (btnRect.width > 0 || btnRect.height > 0) { btn.click(); return; }
          }
          modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
        }
      }
    }
  });
});

// Captures: (pronounCase, theCase, dialogCase, appearOrDisappear) = 4
// Pattern: (I |we )* wait for( the)* modal( dialog)* to (appear|disappear)
When(/^(I |we )*wait for( the)* modal( dialog)* to (appear|disappear)$/, async function (pronounCase, theCase, dialogCase, appearOrDisappear) {
  const shouldAppear = appearOrDisappear === 'appear';
  const modalSelectors = ['.modal', '.modal.show', '.modal.in', '[role="dialog"]', '.dialog', '.popup'];

  const startTime = Date.now();
  while (Date.now() - startTime < 10000) {
    const isVisible = await this.page.evaluate((selectors) => {
      for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) return true;
        }
      }
      return false;
    }, modalSelectors);
    if (shouldAppear === isVisible) return;
    await this.page.waitForTimeout(200);
  }
  throw new Error(`Timeout: Modal did not ${appearOrDisappear} within 10000ms`);
});
