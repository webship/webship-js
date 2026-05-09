'use strict';

// All scroll step definitions live in this file.
//
// Vertical: down / up / to top / to bottom (page or scoped element).
// Horizontal: right / left / to start / to end (page or scoped element).
//
// Default delta when no number is supplied is 350 px.

const { When } = require('@cucumber/cucumber');

// ---------------------------------------------------------------------------
// Vertical scrolling — page
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Vertical scrolling — scoped to a CSS selector
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Horizontal scrolling — page
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Horizontal scrolling — scoped to a CSS selector
// ---------------------------------------------------------------------------

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
