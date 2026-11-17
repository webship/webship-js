'use strict';

// All page-level assertion step definitions live here:
// see / not see text, in element, in row, link href, response body, response
// status code, element existence, CSS property, regex matching, count.
//
// Field-level (checkbox/radio/field-contains) assertions live in field.steps.js.
// URL/path assertions live in navigation.steps.js.
// Modal assertions live in modal.steps.js.

const { Then } = require('@cucumber/cucumber');
const { buildSelector, getLocatorText, locateByLabelOrSelector, failure, excerpt, isTimeout, pageTextLocator } = require('./webship');
const { getLastResponse } = require('./response.steps');

// ---------------------------------------------------------------------------
// Plain page-text
// ---------------------------------------------------------------------------

/**
 * Where a text is on the page, for a failure message: the excerpt of the
 * element that holds it, the element, and whether a visitor can see it.
 *
 * @param {import('playwright').Page} page
 * @param {string} text
 * @returns {Promise<string|undefined>} undefined when it cannot be told.
 */
async function whereTextIs(page, text) {
  try {
    const match = page.locator('body').getByText(text).first();
    if (!(await match.count())) return undefined;
    const info = await match.evaluate((el) => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '',
      text: el.textContent || el.value || '',
    }), null, { timeout: 1000 });
    const visible = await match.isVisible().catch(() => true);
    const attr = info.id ? ` id="${info.id}"` : info.cls ? ` class="${info.cls}"` : '';
    return `"${excerpt(info.text, 80)}" in ${visible ? '' : 'a hidden '}<${info.tag}${attr}>`;
  } catch {
    return undefined;
  }
}

/**
 * Assert that a text is, or is not, on the page.
 *
 * Both polarities read the page the same way, as `eventually I should see`
 * does: the text of the page as Playwright's text matching reads it, letter
 * case ignored, runs of white space collapsed, the text of hidden elements
 * included, the text of `<script>` and `<style>` left out. On a page that
 * reads "Next page", `I should see "next page"` passes and `I should not see
 * "next page"` fails. "should see" waits up to 5 seconds for the text to
 * come, "should not see" up to 5 seconds for it to go.
 *
 * For the text a visitor can see, with its letter case, use `I wait for the
 * text "..." to appear` or `... to disappear`; for an element,
 * `"<selector>" should be visible`.
 *
 * Example #1: Then I should see "Welcome"
 * Example #2: Then we should see "Your accounts for the group is public"
 * Example #3: Then I should not see "Access denied"
 * Example #4: Then we should not see "Edit layout"
 * Example #5: When I press "Save"
 *               Then I should see "Saved"
 *               And I should not see "Saving"
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?"$/, async function (pronounCase, notCase, expectedText) {
  const text = expectedText === undefined || expectedText === null ? '' : expectedText;
  const onPage = pageTextLocator(this.page, text);
  if (notCase) {
    try {
      await onPage.waitFor({ state: 'detached', timeout: 5000 });
    } catch (e) {
      if (!isTimeout(e)) throw e;
      throw failure(this.page, `The text "${text}" is on the page, but it should not be.`, {
        found: await whereTextIs(this.page, text),
        hint: `the step ignores letter case and reads all the text of the page, the text of hidden elements included (not the text of <script> or <style>); it waited 5 seconds for the text to go. To check only the text a visitor can see, with its letter case, use: I wait for the text "${text}" to disappear`,
      });
    }
  } else {
    try {
      await onPage.waitFor({ state: 'attached', timeout: 5000 });
    } catch (e) {
      if (!isTimeout(e)) throw e;
      throw failure(this.page, `The text "${text}" was not found on the page after 5 seconds.`, {
        hint: `check the spelling; letter case is ignored and the text of hidden elements counts. The value of a field, an image and the content of an iframe are not page text. For a text that arrives late, use: eventually I should see "${text}" within 30 seconds`,
      });
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
  let regex;
  try {
    regex = new RegExp(textPattern);
  } catch (e) {
    throw failure(this.page, `"${textPattern}" is not a valid regular expression: ${e.message}`, {
      hint: 'escape the characters that have a meaning in a regular expression, such as ( ) [ ] ? + * and .',
    });
  }
  const match = regex.exec(bodyText);
  if (notCase && match) {
    throw failure(this.page, `The text of the page matches "${textPattern}", but it should not.`, {
      found: `"${excerpt(match[0])}"`,
      hint: 'the pattern is a regular expression tried against the visible text of the whole page.',
    });
  }
  if (!notCase && !match) {
    throw failure(this.page, `No text of the page matches "${textPattern}".`, {
      hint: 'the pattern is a regular expression tried against the visible text of the whole page; ^ and $ stand for the start and the end of that whole text.',
    });
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
  if (notCase && found) {
    throw failure(this.page, `The "${rowIdentifier}" row contains "${expectedText}", but it should not.`, {
      hint: `the row is every table row whose text contains "${rowIdentifier}".`,
    });
  }
  if (!notCase && !found) {
    const rows = await this.page.locator('tr').filter({ hasText: rowIdentifier }).count();
    throw failure(this.page, rows
      ? `The "${rowIdentifier}" row does not contain "${expectedText}".`
      : `No table row contains "${rowIdentifier}", so "${expectedText}" could not be looked for in it.`, {
      found: rows ? `"${excerpt(await this.page.locator('tr').filter({ hasText: rowIdentifier }).first().textContent())}"` : undefined,
      hint: 'check the spelling and the letter case of both texts; the step reads the table rows that are on the page now.',
    });
  }
});

// ---------------------------------------------------------------------------
// Element existence + content
// ---------------------------------------------------------------------------

/**
 * Assert that an element is, or is not, visible on the page. The element is
 * named by its exact visible text; a `<label for="...">` stands for the
 * control it labels. The text is not a CSS selector: for a selector use
 * `"<selector>" should be visible` or `"<selector>" should not be visible`.
 *
 * "should not see" is the opposite of "should see": it passes when no element
 * named that way is visible, so an element that is hidden does not fail it.
 *
 * Example #1: Then I should see a "Username" element
 * Example #2: Then I should not see a "Username" element
 * Example #3: And we should see an "Email" element
 * Example #4: Then I should not see an "Email" element
 * Example #5: And we should not see a "Promo banner" element
 *
 */
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element$/, async function (pronounCase, notCase, aAnCase, element) {
  if (notCase) {
    // Same lookup as the positive branch, over every match, without waiting.
    const named = this.page.getByText(element, { exact: true });
    const forIds = await named.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('for')));
    for (let i = 0; i < forIds.length; i++) {
      const target = forIds[i]
        ? this.page.locator(`[id="${forIds[i].replace(/["\\]/g, '\\$&')}"]`).first()
        : named.nth(i);
      if (await target.isVisible()) {
        throw failure(this.page, `The element "${element}" is visible, but it should not be.`, {
          hint: 'this step finds an element by its exact visible text or by its label.',
        });
      }
    }
  } else {
    const hint = `this step finds an element by its exact visible text or by its label. To find it by its id, class, name or another attribute, use: I should see a "${element}" element by attr`;
    const loc = this.page.getByText(element, { exact: true }).first();
    try {
      await loc.waitFor({ state: 'attached', timeout: 3000 });
    } catch (e) {
      if (!isTimeout(e)) throw e;
      throw failure(this.page, `No element with the text or the label "${element}" was found after 3 seconds.`, { hint });
    }
    const forAttr = await loc.getAttribute('for').catch(() => null);
    try {
      if (forAttr) {
        await this.page.locator('#' + forAttr).waitFor({ state: 'visible', timeout: 3000 });
      } else {
        await loc.waitFor({ state: 'visible', timeout: 3000 });
      }
    } catch (e) {
      if (!isTimeout(e)) throw e;
      throw failure(this.page, forAttr
        ? `The field of the label "${element}" (#${forAttr}) is not visible after 3 seconds.`
        : `The element "${element}" is on the page but not visible after 3 seconds.`, { hint });
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
  const selector = buildSelector(attrValue, attr);
  const loc = this.page.locator(selector);
  if (notCase) {
    const count = await loc.count();
    if (count > 0) {
      throw failure(this.page, `An element with "${attrValue}" is on the page, but it should not be.`, {
        found: `${count} element(s)`,
        hint: attr
          ? `the step looked for an element whose "${attr}" attribute is "${attrValue}"; a hidden element counts too.`
          : `without a named attribute the step tries "${attrValue}" as an id, a class, a name, a test id, an aria-label, a value, a placeholder and a title; a hidden element counts too.`,
      });
    }
  } else {
    try {
      await loc.first().waitFor({ state: 'visible', timeout: 3000 });
    } catch (e) {
      if (!isTimeout(e)) throw e;
      const count = await loc.count().catch(() => 0);
      throw failure(this.page, count
        ? `The element with "${attrValue}" is on the page but not visible after 3 seconds.`
        : `No element with "${attrValue}" was found after 3 seconds.`, {
        hint: attr
          ? `the step looked for an element whose "${attr}" attribute is "${attrValue}".`
          : `without a named attribute the step tries "${attrValue}" as an id, a class, a name, a test id, an aria-label, a value, a placeholder and a title.`,
      });
    }
  }
});

/**
 * Assert that an element contains or does not contain text. The element is
 * named by the exact text of its label, or by a CSS selector.
 *
 * Example #1: Then I should see "John Smith" in the "Username" element
 * Example #2: Then I should not see "Joe Smith" in the "Username" element
 * Example #3: And we should see "1234" in the "Password" element
 * Example #4: Then I should see "About Us" in the "h1" element
 * Example #5: Then we should not see "Error" in the "#status" element
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element$/, async function (pronounCase, notCase, expectedText, theCase, element) {
  const loc = await locateByLabelOrSelector(this.page, element, 5000);
  if (!loc) {
    throw failure(this.page, `The element "${element}" was not found on the page after 5 seconds.`, {
      hint: `"${element}" is read as the exact text of a label, else as a CSS selector. To find an element by its id, class, name or another attribute, add "by attr" to the step.`,
    });
  }
  const content = await getLocatorText(loc);
  if (notCase && content.includes(expectedText)) {
    throw failure(this.page, `The element "${element}" contains "${expectedText}", but it should not.`, {
      found: `"${excerpt(content)}"`,
    });
  }
  if (!notCase && !content.includes(expectedText)) {
    throw failure(this.page, `The element "${element}" does not contain "${expectedText}".`, {
      found: `"${excerpt(content)}"`,
      hint: 'check the spelling and the letter case; for a field the step reads its value.',
    });
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
  try {
    await loc.waitFor({ timeout: 10000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No visible element with "${attrValue}" was found after 10 seconds, so "${expectedText}" could not be looked for in it.`, {
      hint: attr
        ? `the step looked for an element whose "${attr}" attribute is "${attrValue}".`
        : `without a named attribute the step tries "${attrValue}" as an id, a class, a name, a test id, an aria-label, a value, a placeholder and a title.`,
    });
  }
  const content = await getLocatorText(loc);
  if (notCase && content.includes(expectedText)) {
    throw failure(this.page, `The element with "${attrValue}" contains "${expectedText}", but it should not.`, {
      found: `"${excerpt(content)}"`,
    });
  }
  if (!notCase && !content.includes(expectedText)) {
    throw failure(this.page, `The element with "${attrValue}" does not contain "${expectedText}".`, {
      found: `"${excerpt(content)}"`,
      hint: 'check the spelling and the letter case; for a field the step reads its value.',
    });
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
  let regex;
  try {
    regex = new RegExp(textPattern);
  } catch (e) {
    throw failure(this.page, `"${textPattern}" is not a valid regular expression: ${e.message}`, {
      hint: 'escape the characters that have a meaning in a regular expression, such as ( ) [ ] ? + * and .',
    });
  }
  const loc = this.page.locator(element).first();
  try {
    await loc.waitFor({ timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No visible element matches "${element}" after 5 seconds, so its text could not be read.`, {
      hint: `"${element}" is a CSS selector here.`,
    });
  }
  const text = await getLocatorText(loc);
  if (notCase && regex.test(text)) {
    throw failure(this.page, `The text of the element "${element}" matches "${textPattern}", but it should not.`, {
      found: `"${excerpt(text)}"`,
    });
  }
  if (!notCase && !regex.test(text)) {
    throw failure(this.page, `The text of the element "${element}" does not match "${textPattern}".`, {
      found: `"${excerpt(text)}"`,
      hint: 'the pattern is a regular expression; for a field the step reads its value.',
    });
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
  try {
    await loc.waitFor({ timeout: 10000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No visible element with "${selectorRaw}" was found after 10 seconds, so its CSS could not be read.`, {
      hint: `the step tries "${selectorRaw}" as an id, a class, a name, a test id, an aria-label, a value, a placeholder and a title.`,
    });
  }
  const { matches, computed } = await loc.evaluate((el, { prop, expectedVal }) => {
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
    return {
      computed,
      matches: tokenize(normalizeColorTokens(expectedVal.toLowerCase()))
        .every(token => normalizeColorTokens(computed.toLowerCase()).includes(token)),
    };
  }, { prop: cssProperty, expectedVal: expectedValue });

  if (notCase && matches) {
    throw failure(this.page, `The element "${selectorRaw}" has the CSS "${cssProperty}: ${expectedValue}", but it should not.`, {
      found: `${cssProperty}: ${computed}`,
    });
  }
  if (!notCase && !matches) {
    throw failure(this.page, `The element "${selectorRaw}" does not have the CSS "${cssProperty}: ${expectedValue}".`, {
      found: `${cssProperty}: ${computed || '(no value)'}`,
      hint: 'the step compares with the computed style, where a colour is written as rgb(…) and a length in pixels.',
    });
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
    throw failure(this.page, `Expected ${expected} "${selector}" element(s), got ${actual}.`, {
      hint: `"${selector}" is a CSS selector; hidden elements count too.`,
    });
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
  try {
    await loc.waitFor({ timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No visible link with the text "${element}" was found after 5 seconds.`, {
      hint: `the step finds the link by its exact text. To find it by its id, class, title or another attribute, add "by attr" to the step.`,
    });
  }
  const href = await loc.evaluate(el => el.href || el.getAttribute('href') || '');
  if (!href.includes(url)) {
    throw failure(this.page, `The address of the link "${element}" does not contain "${url}".`, {
      found: href ? `"${href}"` : 'the element has no address (no href)',
      hint: 'the step reads the full address the link leads to, with the domain.',
    });
  }
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
  try {
    await loc.waitFor({ timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No visible link with "${attrValue}" was found after 5 seconds.`, {
      hint: attr
        ? `the step looked for an element whose "${attr}" attribute is "${attrValue}".`
        : `without a named attribute the step tries "${attrValue}" as an id, a class, a name, a test id, an aria-label, a value, a placeholder and a title.`,
    });
  }
  const href = await loc.evaluate(el => el.href || el.getAttribute('href') || '');
  if (!href.includes(url)) {
    throw failure(this.page, `The address of the link with "${attrValue}" does not contain "${url}".`, {
      found: href ? `"${href}"` : 'the element has no address (no href)',
      hint: 'the step reads the full address the link leads to, with the domain.',
    });
  }
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
  if (notCase && text.includes(expectedText)) {
    throw failure(this.page, `The response contains "${expectedText}", but it should not.`, {
      hint: 'this step reads all the text of the document, the text that is hidden included.',
    });
  }
  if (!notCase && !text.includes(expectedText)) {
    throw failure(this.page, `The response does not contain "${expectedText}".`, {
      found: `"${excerpt(text)}"`,
      hint: 'this step reads the text of the document the browser shows, not its HTML source.',
    });
  }
});

/**
 * Assert that the current page's response status is or is not a given code.
 *
 * The status is the one the browser received for the page it is showing
 * (after any redirect), read from the browser session itself.
 *
 * Example #1: Then the response status code should be 200
 * Example #2: And the response status code should not be 404
 * Example #3: Then the response status code should be 404
 * Example #4: Then the response status code should not be 500
 * Example #5: When I am on "/admin"
 *               Then the response status code should be 403
 *
 */
Then(/^(the )*response status code should( not)* be (\d+)$/, async function (theCase, notCase, expectedStatusCode) {
  const expected = parseInt(expectedStatusCode, 10);
  const { status } = await getLastResponse(this);
  if (notCase && status === expected) {
    throw failure(this.page, `The response status code is ${expected}, but it should not be.`, {
      hint: 'the step reads the status of the document the browser shows now.',
    });
  }
  if (!notCase && status !== expected) {
    throw failure(this.page, `Expected the response status code ${expected}, got ${status}.`, {
      hint: 'the step reads the status of the document the browser shows now.',
    });
  }
});
