'use strict';

const { friendly, failure, registeredNameHint } = require('./webship');

// Element interactions and visual / positional assertions using Playwright.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// The hint for an element step given a name of the selector registry: the same
// step with the selector the name stands for.
function elementRegistryHint(world, sel, step) {
  return registeredNameHint(world, sel, { withSelector: (selector) => step.replace('{selector}', selector) });
}

/**
 * Assert element A is positioned vertically below element B (greater Y).
 *
 * Example #1: Then the element "#footer" should appear after the element "#main"
 * Example #2: Then the element ".checkout" should appear after the element ".cart"
 * Example #3: And the element "#summary" should appear after the element "#details"
 * Example #4: Then the element "h2" should appear after the element "h1"
 * Example #5: Then the element "[data-testid=cta]" should appear after the element ".hero"
 *
 */
Then('the element {string} should appear after the element {string}', async function (sel1, sel2) {
  const el1 = await this.page.locator(sel1).first();
  const el2 = await this.page.locator(sel2).first();
  const b1 = await el1.boundingBox();
  const b2 = await el2.boundingBox();
  assert.ok(b1 && b2, 'Both elements must be visible.');
  assert.ok(b1.y > b2.y, `Element "${sel1}" should appear after "${sel2}".`);
});

/**
 * A short excerpt of `text` around the place `index`, for a failure message.
 *
 * @param {string} text
 * @param {number} index
 * @param {number} length
 * @returns {string}
 */
function around(text, index, length) {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Check that the first place `after` appears comes later than the first place
 * `before` appears, in the visible text of the page or of one element.
 *
 * @param {Object} world
 * @param {string} after
 * @param {string} before
 * @param {string} [scope] - CSS selector of the element to read; the page when absent.
 */
async function assertTextAfter(world, after, before, scope) {
  let text;
  if (scope) {
    const element = world.page.locator(scope).first();
    try {
      await element.waitFor({ state: 'attached', timeout: 5000 });
    } catch {
      throw failure(world.page, `No element matches "${scope}" after 5 seconds.`, {
        hint: 'the last argument is a CSS selector of the element whose text is read, such as "nav.breadcrumb".',
      });
    }
    text = await element.innerText();
  } else {
    text = await world.page.locator('body').innerText();
  }
  const where = scope ? `in the element "${scope}"` : 'on the page';
  const scopedForm = `the text "${after}" should appear after the text "${before}" in the "<selector>" element`;
  const iAfter = text.indexOf(after);
  const iBefore = text.indexOf(before);
  if (iAfter === -1 || iBefore === -1) {
    const missing = [iAfter === -1 ? after : null, iBefore === -1 ? before : null].filter((t) => t !== null);
    throw failure(world.page, `The text ${missing.map((t) => `"${t}"`).join(' and the text ')} ${missing.length > 1 ? 'are' : 'is'} not ${where}.`, {
      hint: 'the step reads the visible text, with its letter case.',
    });
  }
  if (iAfter <= iBefore) {
    throw failure(world.page, `The text "${after}" does not appear after the text "${before}" ${where}.`, {
      found: `"${after}" first at "${around(text, iAfter, after.length)}"; "${before}" first at "${around(text, iBefore, before.length)}"`,
      hint: scope
        ? 'the step compares the first place each text appears in the visible text of the element, with its letter case.'
        : `the step compares the first place each text appears in the visible text of the whole page, with its letter case, so a menu or a header can decide it. To compare them inside one part of the page, use: ${scopedForm}`,
    });
  }
}

/**
 * Assert text A appears after text B in the visible text of the page.
 *
 * The first place each text appears on the whole page is compared, so a text
 * that a menu or a header also holds is found there first. To compare two
 * texts inside one part of the page, add `in the "<selector>" element`.
 *
 * Example #1: Then the text "Sign in" should appear after the text "Welcome"
 * Example #2: Then the text "Total" should appear after the text "Subtotal"
 * Example #3: And the text "Footer" should appear after the text "Header"
 * Example #4: Then the text "Privacy" should appear after the text "Terms"
 * Example #5: Then the text "Step 3" should appear after the text "Step 2"
 *
 */
Then('the text {string} should appear after the text {string}', async function (t1, t2) {
  await assertTextAfter(this, t1, t2);
});

/**
 * Assert text A appears after text B inside one element: the first place each
 * text appears in the visible text of the first element the selector matches.
 *
 * Example #1: Then the text "Products" should appear after the text "Home" in the "nav.breadcrumb" element
 * Example #2: Then the text "Total" should appear after the text "Subtotal" in the "#cart" element
 * Example #3: And the text "Step 3" should appear after the text "Step 2" in the ".wizard" element
 * Example #4: Then the text "Privacy" should appear after the text "Terms" in the "footer" element
 * Example #5: Then the text "Reply" should appear after the text "Comment" in the "article" element
 *
 */
Then('the text {string} should appear after the text {string} in the {string} element', async function (t1, t2, scope) {
  await assertTextAfter(this, t1, t2, scope);
});

/**
 * Assert at least one element matching `<selector>[<attr>="<value>"]` exists.
 *
 * Example #1: Then the element "a" with the attribute "href" and the value "/about" should exist
 * Example #2: Then the element "input" with the attribute "name" and the value "email" should exist
 * Example #3: And the element "button" with the attribute "type" and the value "submit" should exist
 * Example #4: Then the element "div" with the attribute "data-testid" and the value "user-list" should exist
 * Example #5: Then the element "img" with the attribute "alt" and the value "Logo" should exist
 *
 */
Then('the element {string} with the attribute {string} and the value {string} should exist', async function (sel, attr, value) {
  const count = await this.page.locator(`${sel}[${attr}="${value}"]`).count();
  assert.ok(count > 0, `Element "${sel}" with ${attr}="${value}" not found.`);
});

/**
 * Assert at least one element with attribute value containing a substring exists.
 *
 * Example #1: Then the element "a" with the attribute "href" and the value containing "/about" should exist
 * Example #2: Then the element "input" with the attribute "class" and the value containing "is-valid" should exist
 * Example #3: And the element "button" with the attribute "data-testid" and the value containing "cta" should exist
 * Example #4: Then the element "img" with the attribute "src" and the value containing ".png" should exist
 * Example #5: Then the element "div" with the attribute "aria-label" and the value containing "card" should exist
 *
 */
Then('the element {string} with the attribute {string} and the value containing {string} should exist', async function (sel, attr, value) {
  const count = await this.page.locator(`${sel}[${attr}*="${value}"]`).count();
  assert.ok(count > 0, `Element "${sel}" with ${attr} containing "${value}" not found.`);
});

/**
 * Assert NO element matches `<selector>[<attr>="<value>"]`.
 *
 * Example #1: Then the element "a" with the attribute "href" and the value "/admin" should not exist
 * Example #2: Then the element "input" with the attribute "type" and the value "hidden" should not exist
 * Example #3: And the element "button" with the attribute "disabled" and the value "true" should not exist
 * Example #4: Then the element "div" with the attribute "data-testid" and the value "error" should not exist
 * Example #5: Then the element "img" with the attribute "alt" and the value "" should not exist
 *
 */
Then('the element {string} with the attribute {string} and the value {string} should not exist', async function (sel, attr, value) {
  const count = await this.page.locator(`${sel}[${attr}="${value}"]`).count();
  assert.strictEqual(count, 0, `Element "${sel}" with ${attr}="${value}" should not exist.`);
});

/**
 * Assert NO element has attribute value containing a substring.
 *
 * Example #1: Then the element "a" with the attribute "href" and the value containing "/old" should not exist
 * Example #2: Then the element "div" with the attribute "class" and the value containing "is-error" should not exist
 * Example #3: And the element "button" with the attribute "data-testid" and the value containing "deprecated" should not exist
 * Example #4: Then the element "img" with the attribute "src" and the value containing "tracking" should not exist
 * Example #5: Then the element "input" with the attribute "name" and the value containing "_legacy" should not exist
 *
 */
Then('the element {string} with the attribute {string} and the value containing {string} should not exist', async function (sel, attr, value) {
  const count = await this.page.locator(`${sel}[${attr}*="${value}"]`).count();
  assert.strictEqual(count, 0, `Element "${sel}" with ${attr} containing "${value}" should not exist.`);
});

/**
 * Assert an element is at the top of the viewport: the top of its box is
 * between 0 and 100 pixels from the top of the viewport. The step looks
 * again for up to 5 seconds, so an element still on its way after a smooth
 * scroll gets there.
 *
 * Example #1: Then the element "#header" should be at the top of the viewport
 * Example #2: Then the element "h1" should be at the top of the viewport
 * Example #3: And the element ".sticky-nav" should be at the top of the viewport
 * Example #4: When I scroll to the top
 *               Then the element "#hero" should be at the top of the viewport
 * Example #5: Then the element "[role=banner]" should be at the top of the viewport
 * Example #6: When I click "Go to section 3"
 *               Then the element "#section-3" should be at the top of the viewport
 *
 */
Then('the element {string} should be at the top of the viewport', async function (sel) {
  const element = this.page.locator(sel).first();
  const deadline = Date.now() + 5000;
  let state = 'missing';
  let top = null;
  for (;;) {
    if (await element.count().catch(() => 0)) {
      const box = await element.boundingBox().catch(() => null);
      if (box) {
        top = box.y;
        state = 'placed';
        if (top >= 0 && top <= 100) return;
      } else {
        state = 'hidden';
      }
    } else {
      state = 'missing';
    }
    if (Date.now() >= deadline) break;
    await this.page.waitForTimeout(100);
  }
  if (state === 'missing') {
    throw failure(this.page, `No element matches "${sel}" after 5 seconds.`, {
      hint: elementRegistryHint(this, sel, 'the element "{selector}" should be at the top of the viewport') ||
        'the argument is a CSS selector, such as "#hero" or "header.site-header".',
    });
  }
  if (state === 'hidden') {
    throw failure(this.page, `The element "${sel}" is on the page but not visible after 5 seconds.`, {
      hint: 'a hidden element has no place in the viewport.',
    });
  }
  throw failure(this.page, `The element "${sel}" is not at the top of the viewport after 5 seconds.`, {
    found: `its top is ${Math.round(top)} px from the top of the viewport`,
    hint: `the step passes when the top of the element is between 0 and 100 pixels from the top of the viewport. To bring it there, use: When I scroll to the element "${sel}"`,
  });
});

/**
 * Assert an element is horizontally centered in the viewport (±10% tolerance).
 *
 * Example #1: Then the element ".hero" should be centered in the viewport
 * Example #2: Then the element "#cta" should be centered in the viewport
 * Example #3: And the element ".modal-dialog" should be centered in the viewport
 * Example #4: Then the element "h1" should be centered in the viewport
 * Example #5: Then the element ".loader" should be centered in the viewport
 *
 */
Then('the element {string} should be centered in the viewport', async function (sel) {
  const box = await this.page.locator(sel).first().boundingBox();
  assert.ok(box, `Element "${sel}" not found.`);
  // Read the width from the page: page.viewportSize() is null when the
  // browser context is opened with a fluid viewport (`viewport: null`).
  const vw = await this.page.evaluate(() => document.documentElement.clientWidth);
  const center = box.x + box.width / 2;
  const tolerance = vw * 0.1;
  assert.ok(Math.abs(center - vw / 2) <= tolerance, `Element "${sel}" not centered (center=${center}, vw=${vw}).`);
});

// Native browser dialog handlers (alert / confirm / prompt) live in
// tests/step-definitions/dialog.steps.js.

/**
 * Click an element addressed by CSS selector.
 *
 * Example #1: When I click on the element "#sign-in"
 * Example #2: When I click on the element ".btn-primary"
 * Example #3: And we click on the element "[data-testid=cta]"
 * Example #4: When I click on the element "li.nav-item:first-child a"
 * Example #5: When I click on the element "button[aria-label='Close']"
 *
 */
When(/^(I |we )*click on the element "([^"]*)"$/, async function (pronoun, sel) {
  try {
    await this.page.locator(sel).first().click();
  } catch (e) {
    throw friendly({
      action: `click on the element "${sel}"`,
      cause: e,
      hint: elementRegistryHint(this, sel, 'I click on the element "{selector}"') || `check that the element exists on the page, is visible, and is clickable.`,
    });
  }
});

/**
 * Dispatch a synthetic JavaScript event on a CSS-addressed element.
 *
 * Useful for components that listen for non-bubbling events or for events
 * Playwright cannot synthesize through normal interactions.
 *
 * Example #1: When I trigger the JS event "click" on the element "#cta"
 * Example #2: When I trigger the JS event "change" on the element "#country"
 * Example #3: And I trigger the JS event "input" on the element "#search"
 * Example #4: When I trigger the JS event "focus" on the element "#email"
 * Example #5: When I trigger the JS event "blur" on the element "#name"
 *
 */
When(/^(I |we )*trigger the JS event "([^"]*)" on the element "([^"]*)"$/, async function (pronoun, event, sel) {
  try {
    await this.page.locator(sel).first().dispatchEvent(event);
  } catch (e) {
    throw friendly({
      action: `trigger the "${event}" event on "${sel}"`,
      cause: e,
      hint: elementRegistryHint(this, sel, `I trigger the JS event "${event}" on the element "{selector}"`) || `use a standard event name like click, change, input, focus, or blur.`,
    });
  }
});

/**
 * Scroll a CSS-addressed element into view (uses Playwright's auto-scroll).
 *
 * Example #1: When I scroll to the element "#footer"
 * Example #2: When I scroll to the element ".pricing-table"
 * Example #3: And we scroll to the element "[data-testid=signup-cta]"
 * Example #4: When I scroll to the element "tbody tr:nth-child(20)"
 * Example #5: When I scroll to the element ".testimonial:last-child"
 *
 */
When(/^(I |we )*scroll to the element "([^"]*)"$/, async function (pronoun, sel) {
  try {
    await this.page.locator(sel).first().scrollIntoViewIfNeeded();
  } catch (e) {
    throw friendly({
      action: `scroll to "${sel}"`,
      cause: e,
      hint: elementRegistryHint(this, sel, 'I scroll to the element "{selector}"') || `check the element exists on the page and was not removed before scrolling.`,
    });
  }
});

/**
 * Hover the mouse pointer over a CSS-addressed element.
 *
 * Example #1: When I hover over the element ".tooltip-trigger"
 * Example #2: When I hover over the element "#user-menu"
 * Example #3: And we hover over the element "[data-testid=avatar]"
 * Example #4: When I hover over the element "img.preview"
 * Example #5: When I hover over the element "li.menu-item"
 *
 */
When(/^(I |we )*hover over the element "([^"]*)"$/, async function (pronoun, sel) {
  try {
    await this.page.locator(sel).first().hover();
  } catch (e) {
    throw friendly({
      action: `hover over "${sel}"`,
      cause: e,
      hint: elementRegistryHint(this, sel, 'I hover over the element "{selector}"') || `check the element exists, is visible, and is not covered by another element.`,
    });
  }
});

/**
 * Move keyboard focus to a CSS-addressed element.
 *
 * Example #1: When I focus on the element "#email"
 * Example #2: When I focus on the element "input[type=search]"
 * Example #3: And we focus on the element "[data-testid=combobox]"
 * Example #4: When I focus on the element "textarea#message"
 * Example #5: When I focus on the element "button.primary"
 *
 */
When(/^(I |we )*focus on the element "([^"]*)"$/, async function (pronoun, sel) {
  try {
    await this.page.locator(sel).first().focus();
  } catch (e) {
    throw friendly({
      action: `focus on "${sel}"`,
      cause: e,
      hint: elementRegistryHint(this, sel, 'I focus on the element "{selector}"') || `the element must be focusable — an input, button, link, or have a tabindex.`,
    });
  }
});

/**
 * Wait for a CSS-addressed element to become visible (display !== none, etc.).
 *
 * Example #1: Then the element "#dashboard" should be displayed
 * Example #2: Then the element ".success-banner" should be displayed
 * Example #3: And the element "[data-testid=user-list]" should be displayed
 * Example #4: Then the element ".toast" should be displayed
 * Example #5: When I press "Save"
 *               Then the element ".toast-success" should be displayed
 *
 */
Then('the element {string} should be displayed', async function (sel) {
  await this.page.locator(sel).first().waitFor({ state: 'visible' });
});

/**
 * Assert a CSS-addressed element is hidden or absent.
 *
 * Example #1: Then the element "#loading-spinner" should not be displayed
 * Example #2: Then the element ".error-banner" should not be displayed
 * Example #3: And the element "[data-testid=skeleton]" should not be displayed
 * Example #4: Then the element ".modal" should not be displayed
 * Example #5: When I press "Submit"
 *               Then the element ".pending-badge" should not be displayed
 *
 */
Then('the element {string} should not be displayed', async function (sel) {
  const loc = this.page.locator(sel).first();
  const count = await loc.count();
  if (count === 0) return;
  assert.ok(!(await loc.isVisible()), `Element "${sel}" should not be displayed.`);
});

async function inViewport(page, sel, topOffset = 0) {
  return await page.locator(sel).first().evaluate((el, off) => {
    const r = el.getBoundingClientRect();
    return r.top >= off && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
  }, topOffset);
}

/**
 * Assert an element is fully inside the current viewport rectangle.
 *
 * Example #1: Then the element "#hero" should be displayed within a viewport
 * Example #2: Then the element ".cta" should be displayed within a viewport
 * Example #3: And the element "[data-testid=summary]" should be displayed within a viewport
 * Example #4: Then the element "h1" should be displayed within a viewport
 * Example #5: When I scroll to the element "#footer"
 *               Then the element "#footer" should be displayed within a viewport
 *
 */
Then('the element {string} should be displayed within a viewport', async function (sel) {
  assert.ok(await inViewport(this.page, sel, 0), `Element "${sel}" is not within viewport.`);
});

/**
 * Assert an element is fully inside the viewport, allowing a top offset.
 * Useful for sticky headers — pass the header height as the offset.
 *
 * Example #1: Then the element "#hero" should be displayed within a viewport with a top offset of 60 pixels
 * Example #2: Then the element ".main" should be displayed within a viewport with a top offset of 80 pixels
 * Example #3: And the element ".cta" should be displayed within a viewport with a top offset of 50 pixels
 * Example #4: Then the element "h1" should be displayed within a viewport with a top offset of 100 pixels
 * Example #5: Then the element "#summary" should be displayed within a viewport with a top offset of 64 pixels
 *
 */
Then('the element {string} should be displayed within a viewport with a top offset of {int} pixels', async function (sel, off) {
  assert.ok(await inViewport(this.page, sel, off), `Element "${sel}" is not within viewport (offset ${off}).`);
});

/**
 * Assert an element is NOT inside the viewport (top-offset variant).
 *
 * Example #1: Then the element "#footer" should not be displayed within a viewport with a top offset of 60 pixels
 * Example #2: Then the element ".off-screen" should not be displayed within a viewport with a top offset of 80 pixels
 * Example #3: And the element ".pending" should not be displayed within a viewport with a top offset of 50 pixels
 * Example #4: Then the element "#cookies-banner" should not be displayed within a viewport with a top offset of 100 pixels
 * Example #5: Then the element ".low-priority" should not be displayed within a viewport with a top offset of 64 pixels
 *
 */
Then('the element {string} should not be displayed within a viewport with a top offset of {int} pixels', async function (sel, off) {
  assert.ok(!(await inViewport(this.page, sel, off)), `Element "${sel}" should not be in viewport (offset ${off}).`);
});

/**
 * Assert an element is NOT inside the viewport rectangle.
 *
 * Example #1: Then the element "#footer" should not be displayed within a viewport
 * Example #2: Then the element ".off-screen" should not be displayed within a viewport
 * Example #3: And the element ".pending" should not be displayed within a viewport
 * Example #4: Then the element "#cookies-banner" should not be displayed within a viewport
 * Example #5: Then the element ".low-priority" should not be displayed within a viewport
 *
 */
Then('the element {string} should not be displayed within a viewport', async function (sel) {
  assert.ok(!(await inViewport(this.page, sel, 0)), `Element "${sel}" should not be in viewport.`);
});
