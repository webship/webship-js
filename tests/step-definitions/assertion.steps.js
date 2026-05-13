'use strict';

// All page-level assertion step definitions live here:
// see / not see text, in element, in row, link href, response body, response
// status code, element existence, CSS property, regex matching, count.
//
// Field-level (checkbox/radio/field-contains) assertions live in field.steps.js.
// URL/path assertions live in navigation.steps.js.
// Modal assertions live in modal.steps.js.

const { Then } = require('@cucumber/cucumber');
const assert = require('assert');
const axios = require('axios');
const { buildSelector, getLocatorText, friendly } = require('./webship');

// ---------------------------------------------------------------------------
// Plain page-text
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Table-row text
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Element existence + content
// ---------------------------------------------------------------------------

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
 * Assert that an element's text content does or does not match a regex.
 *
 * Example #1: Then I should see text matching "\d{4}" in the "#year" element
 * Example #2: Then I should see text matching "\$\d+\.\d{2}" in the "#price" element
 * Example #3: Then I should not see text matching "Error" in the "#status" element
 * Example #4: Then we should see text matching "^[A-Z][a-z]+ [A-Z][a-z]+$" in the "#full-name" element
 * Example #5: Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element
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
    throw friendly(`Expected ${expected} "${selector}" element(s), got ${actual}.`);
  }
});

// ---------------------------------------------------------------------------
// Link href
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Response body / status
// ---------------------------------------------------------------------------

/**
 * Assert that the rendered HTML response contains or does not contain text.
 *
 * Reads the entire `<html>` text — useful for checking text that lives in
 * `<head>` (meta descriptions, JSON-LD), `<noscript>`, or hidden regions.
 *
 * Example #1: Then the response should contain "Welcome visitor"
 * Example #2: Then the response should not contain "Access denied"
 * Example #3: And the response should contain "<title>Home</title>"
 * Example #4: Then the response should contain "<html"
 * Example #5: When I am on "/about"
 *               Then the response should contain "Our mission"
 *               And the response should not contain "TODO"
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
