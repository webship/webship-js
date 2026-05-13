'use strict';

const { friendly } = require('./webship');

// Pointer input steps not covered by the core element/click steps:
// hover variants, drag-and-drop, double-click, right-click, viewport size.

const { When } = require('@cucumber/cucumber');

function explainPtr(action, sel, e) {
  return friendly({
    action: `${action} "${sel}"`,
    cause: e,
    hint: `check the element exists on the page, is visible, and is not covered by an overlay.`,
  });
}

// ---------------------------------------------------------------------------
// Hover (variants)
// ---------------------------------------------------------------------------

/**
 * Hover the mouse pointer over a CSS-addressed element.
 *
 * Example #1: When I hover over "#nav-products"
 * Example #2: When I hover over ".tooltip-trigger"
 * Example #3: And we hover over "[data-testid=user-menu]"
 * Example #4: When I hover over "button.help"
 * Example #5: When I hover over ".chart-bar:nth-child(3)"
 *
 */
When(/^(I |we )*hover over "([^"]*)"$/, async function (pronoun, sel) {
  try { await this.page.locator(sel).first().hover(); }
  catch (e) { throw explainPtr('hover over', sel, e); }
});

/**
 * Move the mouse pointer over a CSS-addressed element (alias for hover).
 *
 * Example #1: When I move the pointer to "#cta"
 * Example #2: When we move the pointer to ".dropdown-trigger"
 * Example #3: And I move the pointer to "[data-testid=avatar]"
 * Example #4: When I move the pointer to "img.gallery-thumb"
 * Example #5: When I move the pointer to ".legend-item"
 *
 */
When(/^(I |we )*move the pointer to "([^"]*)"$/, async function (pronoun, sel) {
  try { await this.page.locator(sel).first().hover(); }
  catch (e) { throw explainPtr('move pointer to', sel, e); }
});

// ---------------------------------------------------------------------------
// Click variants
// ---------------------------------------------------------------------------

/**
 * Double-click on a CSS-addressed element.
 *
 * Example #1: When I double-click on "#row-1"
 * Example #2: When I double click on ".file-tile"
 * Example #3: And we double-click on "[data-testid=cell-A1]"
 * Example #4: When I double-click on "img.editable"
 * Example #5: When I double click on "td.editable-cell"
 *
 */
When(/^(I |we )*double[- ]click on "([^"]*)"$/, async function (pronoun, sel) {
  try { await this.page.locator(sel).first().dblclick(); }
  catch (e) { throw explainPtr('double-click', sel, e); }
});

/**
 * Right-click (context menu) on a CSS-addressed element.
 *
 * Example #1: When I right-click on "#row-1"
 * Example #2: When I right click on ".tree-node"
 * Example #3: And we right-click on "[data-testid=image]"
 * Example #4: When I right-click on "li.contact"
 * Example #5: When I right click on "td.cell"
 *
 */
When(/^(I |we )*right[- ]click on "([^"]*)"$/, async function (pronoun, sel) {
  try { await this.page.locator(sel).first().click({ button: 'right' }); }
  catch (e) { throw explainPtr('right-click', sel, e); }
});

/**
 * Middle-click on a CSS-addressed element.
 *
 * Example #1: When I middle-click on "a.external"
 * Example #2: When I middle click on "#tab-2"
 * Example #3: And we middle-click on "[data-testid=link]"
 * Example #4: When I middle-click on "li.bookmark"
 * Example #5: When I middle click on "a.product-link"
 *
 */
When(/^(I |we )*middle[- ]click on "([^"]*)"$/, async function (pronoun, sel) {
  try { await this.page.locator(sel).first().click({ button: 'middle' }); }
  catch (e) { throw explainPtr('middle-click', sel, e); }
});

/**
 * Click on a CSS-addressed element while holding a modifier key.
 *
 * Modifier names follow Playwright: `Shift`, `Control`, `Alt`, `Meta`.
 *
 * Example #1: When I click on "#row-1" while holding "Shift"
 * Example #2: When I click on ".checkbox" while holding "Control"
 * Example #3: And we click on "a.external" while holding "Meta"
 * Example #4: When I click on ".item" while holding "Alt"
 * Example #5: When I click on "#tab-2" while holding "Shift"
 *
 */
When(/^(I |we )*click on "([^"]*)" while holding "([^"]*)"$/, async function (pronoun, sel, key) {
  try {
    await this.page.locator(sel).first().click({ modifiers: [key] });
  } catch (e) {
    throw friendly({
      action: `click "${sel}" while holding "${key}"`,
      cause: e,
      hint: `modifier must be one of: Shift, Control, Alt, Meta.`,
    });
  }
});

// ---------------------------------------------------------------------------
// Drag and drop
// ---------------------------------------------------------------------------

/**
 * Drag a source element onto a target element.
 *
 * Example #1: When I drag "#card-1" to "#column-done"
 * Example #2: When I drag ".file-tile" to "#trash"
 * Example #3: And we drag "[data-testid=task-1]" to "[data-testid=in-progress]"
 * Example #4: When I drag "#image" to "#canvas"
 * Example #5: When I drag "li.draggable" to "ul.dropzone"
 *
 */
When(/^(I |we )*drag "([^"]*)" to "([^"]*)"$/, async function (pronoun, source, target) {
  try {
    await this.page.locator(source).first().dragTo(this.page.locator(target).first());
  } catch (e) {
    throw friendly({
      action: `drag "${source}" to "${target}"`,
      cause: e,
      hint: `both items must exist on the page; the target must accept drops.`,
    });
  }
});

// ---------------------------------------------------------------------------
// Viewport
// ---------------------------------------------------------------------------

/**
 * Resize the browser viewport to a specific WxH.
 *
 * Example #1: When I set the viewport size to 1280x720
 * Example #2: When I set the viewport size to 375x667
 * Example #3: And we set the viewport size to 768x1024
 * Example #4: When I set the viewport size to 1920x1080
 * Example #5: When I set the viewport size to 320x568
 *
 */
When(/^(I |we )*set the viewport size to (\d+)x(\d+)$/, async function (pronoun, w, h) {
  try {
    await this.page.setViewportSize({ width: parseInt(w, 10), height: parseInt(h, 10) });
  } catch (e) {
    throw friendly({
      action: `set viewport size to ${w}x${h}`,
      cause: e,
      hint: `the browser was opened in fluid-viewport mode; set a fixed viewport in playwright.config.ts contextOptions.viewport.`,
    });
  }
});

// ---------------------------------------------------------------------------
// Tap (touch)
// ---------------------------------------------------------------------------

/**
 * Touch-tap a CSS-addressed element. Falls back to a regular click if the
 * browser context was not opened with `hasTouch: true`.
 *
 * Example #1: When I tap on "#cta"
 * Example #2: When I tap on ".bottom-nav-item"
 * Example #3: And we tap on "[data-testid=fab]"
 * Example #4: When I tap on "button.menu"
 * Example #5: When I tap on ".swipe-card"
 *
 */
When(/^(I |we )*tap on "([^"]*)"$/, async function (pronoun, sel) {
  try {
    await this.page.locator(sel).first().tap();
  } catch (e) {
    if (/hasTouch/i.test(e.message)) {
      await this.page.locator(sel).first().click();
    } else {
      throw e;
    }
  }
});
