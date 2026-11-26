'use strict';

// All wait/settle step definitions live in this file.
//
// Behavior-Based Robotics (BBR) principle: react to the environment, not the
// clock. A wait step never blocks for a fixed duration — it returns as soon
// as the page is at the *edge* of activity, bounded by a budget so a runaway
// page cannot stall the run.
//
// Shared smartSettle and modal probes are imported from webship.js
// so this file never duplicates BBR plumbing.

const { When } = require('@cucumber/cucumber');
const { smartSettle, pollPage, pageClockOffset, waitForModalState, friendly, failure, excerpt, isTimeout, pageTextLocator } = require('./webship');

// A step whose length the scenario gives ("I wait 2 minutes", "within 60
// seconds") runs for that time, past the step timeout too (45 s,
// WEBSHIP_STEP_TIMEOUT): its definition takes OWN_LENGTH, which sets no
// cucumber time limit, and the step bounds itself with withinTimeLimit.
const OWN_LENGTH = { timeout: -1 };

// How long past its own length a step waits for a page that stopped answering.
const TIME_LIMIT_MARGIN_MS = 15000;

/**
 * Run the work of a step whose length the scenario gives, bounded by that
 * length plus a margin, so that a page that stopped answering ends the step
 * with a plain failure instead of hanging the run.
 *
 * @param {number} ms       - The length the scenario gave, in ms.
 * @param {string} what     - The step's work, for the failure ("The wait of 2 minutes").
 * @param {Function} work   - Returns the promise of the work.
 * @returns {Promise<*>} What the work returns.
 */
async function withinTimeLimit(ms, what, work) {
  const limit = ms + TIME_LIMIT_MARGIN_MS;
  let timer;
  const overdue = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(friendly(
      `${what} did not end: the page did not answer within ${Math.ceil(limit / 1000)} seconds.\n` +
      '  Hint: a script of the page may never return; open the page in a browser to see it.'
    )), limit);
  });
  try {
    return await Promise.race([Promise.resolve().then(work), overdue]);
  } finally {
    clearTimeout(timer);
  }
}

// Settle the page for the length a wait step was given, past the step timeout too.
function settleFor(world, ms, what) {
  return withinTimeLimit(ms, what, () => smartSettle(world.page, ms));
}

/**
 * Wait UP TO N seconds for the page to settle. Returns early on idle.
 *
 * Like every wait whose length the scenario gives, it runs for that length
 * even past the step timeout (45 s, WEBSHIP_STEP_TIMEOUT).
 *
 * "Settle" = DOM ready, no in-flight fetch/XHR, no pending setTimeout
 * callbacks, and no MutationObserver activity for at least 250 ms.
 *
 * Example #1: When I wait for 1 second
 * Example #2: When I wait for 5 seconds
 * Example #3: And I wait for 3 seconds
 * Example #4: When we wait for 2 seconds
 * Example #5: And we wait for 10 seconds
 * Example #6: When I press "Save"
 *               And I wait for 2 seconds
 *               Then I should see "Saved"
 *
 */
When(/^(I |we )*wait for (\d+) seconds?$/, OWN_LENGTH, async function (pronoun, seconds) {
  await settleFor(this, parseInt(seconds, 10) * 1000, `The wait for ${seconds} seconds`);
});

/**
 * Wait UP TO N seconds for the page (and AJAX) to settle. Returns early.
 *
 * Same probe as `wait for N seconds` — kept for legacy phrasing parity with
 * older feature files that say "for AJAX to finish" explicitly.
 *
 * Example #1: When I wait for 1 second for AJAX to finish
 * Example #2: When I wait for 3 seconds for AJAX to finish
 * Example #3: And I wait for 5 seconds for AJAX to finish
 * Example #4: When we wait for 2 seconds for AJAX to finish
 * Example #5: When I press "Search"
 *               And I wait for 5 seconds for AJAX to finish
 *               Then I should see "Results"
 *
 */
When(/^(I |we )*wait for (\d+) seconds? for AJAX to finish$/, OWN_LENGTH, async function (pronoun, seconds) {
  await settleFor(this, parseInt(seconds, 10) * 1000, `The wait for ${seconds} seconds for AJAX`);
});

/**
 * Wait UP TO a number of seconds for the page to settle. A number with no
 * unit is read as seconds.
 *
 * Example #1: When I wait 1 second
 * Example #2: When I wait 5 seconds
 * Example #3: When we wait 3s
 * Example #4: And wait 2s
 * Example #5: And wait 2 seconds
 * Example #6: When we wait 1 second
 * Example #7: When we wait 5 seconds
 * Example #8: When we wait 4s
 * Example #9: When I wait 2
 *
 */
When(/^(I |we )*wait (\d+)( second| seconds|s)?$/, OWN_LENGTH, async function (pronounCase, number, withSecondWord) {
  await settleFor(this, parseInt(number, 10) * 1000, `The wait of ${number} seconds`);
});

/**
 * Wait UP TO a maximum number of seconds for the page to settle. A number with
 * no unit is read as seconds.
 *
 * Example #1: When I wait max of 1 second
 * Example #2: When I wait max of 5 seconds
 * Example #3: When we wait max of 3s
 * Example #4: And wait max of 2s
 * Example #5: And wait max of 2 seconds
 * Example #6: When we wait max of 1 second
 * Example #7: When we wait max of 5 seconds
 * Example #8: When we wait max of 4s
 * Example #9: When I wait max of 2
 *
 */
When(/^(I |we )*wait max of (\d+)( second| seconds|s)?$/, OWN_LENGTH, async function (pronounCase, number, withSecondWord) {
  await settleFor(this, parseInt(number, 10) * 1000, `The wait of at most ${number} seconds`);
});

/**
 * Wait UP TO a number of minutes for the page to settle. The unit is required:
 * a number with no unit is read as seconds.
 *
 * Example #1: When I wait 1 minute
 * Example #2: When I wait 10 minutes
 * Example #3: When we wait 1m
 * Example #4: And wait 2m
 * Example #5: And wait 2 minutes
 *
 */
When(/^(I |we )*wait (\d+)( minute| minutes|m)$/, OWN_LENGTH, async function (pronounCase, number, withMinuteWord) {
  await settleFor(this, parseInt(number, 10) * 1000 * 60, `The wait of ${number} minutes`);
});

/**
 * Wait UP TO a maximum number of minutes for the page to settle. The unit is
 * required: a number with no unit is read as seconds.
 *
 * Example #1: When I wait max of 1 minute
 * Example #2: When I wait max of 10 minutes
 * Example #3: When we wait max of 1m
 * Example #4: And wait max of 2m
 * Example #5: And wait max of 2 minutes
 *
 */
When(/^(I |we )*wait max of (\d+)( minute| minutes|m)$/, OWN_LENGTH, async function (pronounCase, number, withMinuteWord) {
  await settleFor(this, parseInt(number, 10) * 1000 * 60, `The wait of at most ${number} minutes`);
});

/**
 * Wait until the page is loaded.
 *
 * Example #1: When I wait until the page is loaded
 * Example #2: When we wait until the page is loaded
 * Example #3: When wait until page loaded
 * Example #4: And I wait until the page is loaded
 * Example #5: When we wait until page is loaded
 *
 */
When(/^(I |we )*wait until( the)* page( is)* loaded*$/, async function (pronounCase, theCase, withIs) {
  await smartSettle(this.page, 10000);
});

/**
 * Wait for active XHR/fetch requests to complete. "AJAX" may be written in
 * any letter case.
 *
 * Example #1: When I wait for AJAX to finish
 * Example #2: And I wait for AJAX to finish
 * Example #3: When we wait for AJAX to finish
 * Example #4: And wait for AJAX to finish
 * Example #5: When I wait for ajax to finish
 *
 */
When(/^(I |we )*wait for (?:AJAX|ajax|Ajax) to finish$/, async function (pronounCase) {
  await smartSettle(this.page, 10000);
});

/**
 * Wait for a modal dialog to appear or disappear.
 *
 * Example #1: When I wait for the modal to appear
 * Example #2: When I wait for the modal to disappear
 * Example #3: When we wait for modal to appear
 * Example #4: And I wait for the modal dialog to disappear
 * Example #5: When we wait for the modal dialog to appear
 *
 */
When(/^(I |we )*wait for( the)* modal( dialog)* to (appear|disappear)$/, async function (pronounCase, theCase, dialogCase, appearOrDisappear) {
  const state = appearOrDisappear === 'appear' ? 'visible' : 'hidden';
  await waitForModalState(this.page, state, 10000, this);
});

/**
 * Wait until a CSS selector becomes visible. Returns the moment the
 * matching element is on screen (display !== 'none', visibility !== 'hidden',
 * has a non-zero box). This is the canonical "wait until X appears" probe.
 *
 * Example #1: When I wait for "#dashboard" to appear
 * Example #2: When I wait for ".success-banner" to appear
 * Example #3: And I wait for "[data-testid=user-list]" to appear
 * Example #4: When we wait for ".modal.show" to appear
 * Example #5: When I press "Save"
 *               And I wait for ".toast-success" to appear
 *
 */
When(/^(I |we )*wait for "([^"]*)" to appear$/, async function (pronounCase, selector) {
  try {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    const present = await this.page.locator(selector).count().catch(() => 0);
    throw failure(this.page, present
      ? `The element "${selector}" is on the page but did not become visible within 10 seconds.`
      : `The element "${selector}" did not appear within 10 seconds.`, {
      hint: `"${selector}" is a CSS selector. For a text, use: I wait for the text "..." to appear`,
    });
  }
});

/**
 * Wait until a CSS selector becomes hidden (display:none, visibility:hidden,
 * detached, or zero-size).
 *
 * Example #1: When I wait for "#loading-spinner" to disappear
 * Example #2: When I wait for ".overlay" to disappear
 * Example #3: And I wait for ".modal.show" to disappear
 * Example #4: When we wait for "[data-testid=skeleton]" to disappear
 * Example #5: When I press "Submit"
 *               And I wait for ".loader" to disappear
 *               Then I should see "Saved"
 *
 */
When(/^(I |we )*wait for "([^"]*)" to disappear$/, async function (pronounCase, selector) {
  try {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout: 10000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The element "${selector}" is still visible after 10 seconds.`, {
      hint: `"${selector}" is a CSS selector; the step passes when the first element it matches is hidden or gone.`,
    });
  }
});

/**
 * Wait until visible text appears anywhere on the page.
 *
 * Polls `document.body.innerText` every 100 ms for up to 10 s. Match is
 * case-sensitive substring.
 *
 * Example #1: When I wait for the text "Dashboard" to appear
 * Example #2: When I wait for the text "Loading complete" to appear
 * Example #3: And I wait for text "Welcome" to appear
 * Example #4: When we wait for the text "Order #1234" to appear
 * Example #5: When I press "Submit"
 *               And I wait for the text "Thank you" to appear
 *
 */
When(/^(I |we )*wait for( the)* text "([^"]*)" to appear$/, async function (pronounCase, theCase, text) {
  try {
    await this.page.waitForFunction(
      (t) => document.body && document.body.innerText.includes(t),
      text, { timeout: 10000, polling: 100 }
    );
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The text "${text}" did not appear within 10 seconds.`, {
      hint: 'check the spelling and the letter case; the step reads the visible text of the page.',
    });
  }
});

/**
 * Wait until visible text is gone from the page.
 *
 * Example #1: When I wait for the text "Loading…" to disappear
 * Example #2: When I wait for the text "Saving" to disappear
 * Example #3: And I wait for text "Pending" to disappear
 * Example #4: When we wait for the text "Connecting" to disappear
 * Example #5: When I press "Submit"
 *               And I wait for the text "Validating" to disappear
 *               Then I should see "Done"
 *
 */
When(/^(I |we )*wait for( the)* text "([^"]*)" to disappear$/, async function (pronounCase, theCase, text) {
  try {
    await this.page.waitForFunction(
      (t) => !document.body || !document.body.innerText.includes(t),
      text, { timeout: 10000, polling: 100 }
    );
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The text "${text}" is still on the page after 10 seconds.`, {
      hint: 'the step reads the visible text of the page.',
    });
  }
});

/**
 * Wait until the current URL contains a fragment.
 *
 * Useful after a redirect, push-state navigation, or hash-based routing.
 *
 * Example #1: When I wait until the URL contains "/dashboard"
 * Example #2: When I wait until the URL contains "?step=2"
 * Example #3: And I wait until the URL contains "#confirmation"
 * Example #4: When we wait until the URL contains "/orders/"
 * Example #5: When I follow "Sign in"
 *               And I wait until the URL contains "/auth/callback"
 *
 */
When(/^(I |we )*wait until( the)* URL contains "([^"]*)"$/, async function (pronounCase, theCase, fragment) {
  try {
    await this.page.waitForFunction(
      (frag) => window.location.href.includes(frag),
      fragment, { timeout: 10000, polling: 100 }
    );
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The URL does not contain "${fragment}" after 10 seconds.`, {
      hint: 'the step looks for the text in the whole address, with the domain, the query and the hash.',
    });
  }
});

/**
 * Wait until `document.title` equals (`is`) or contains the given value.
 *
 * Example #1: When I wait until the page title is "Dashboard - MyApp"
 * Example #2: When I wait until the page title contains "Dashboard"
 * Example #3: And I wait until the page title contains "(3 unread)"
 * Example #4: When we wait until the page title is "Order Placed"
 * Example #5: When I follow "Inbox"
 *               And I wait until the page title contains "Inbox"
 *
 */
When(/^(I |we )*wait until( the)* page title (is|contains) "([^"]*)"$/, async function (pronounCase, theCase, op, value) {
  try {
    await this.page.waitForFunction(
      ({ op, value }) => op === 'is' ? document.title === value : document.title.includes(value),
      { op, value }, { timeout: 10000, polling: 100 }
    );
  } catch (e) {
    if (!isTimeout(e)) throw e;
    const title = await this.page.title().catch(() => '');
    throw failure(this.page, op === 'is'
      ? `The page title is not "${value}" after 10 seconds.`
      : `The page title does not contain "${value}" after 10 seconds.`, {
      found: `"${excerpt(title)}"`,
      hint: 'the page title is the text of the browser tab, not the main heading of the page.',
    });
  }
});

/**
 * Wait until exactly N elements match a CSS selector.
 *
 * Use 0 to wait for elements to disappear, or a positive count to wait for
 * a specific number to render.
 *
 * Example #1: When I wait until 5 elements match ".product-card"
 * Example #2: When I wait until 0 elements match ".loading-skeleton"
 * Example #3: And I wait until 1 element matches ".active-row"
 * Example #4: When we wait until 10 elements match "tr.user"
 * Example #5: When I press "Load more"
 *               And I wait until 20 elements match ".feed-item"
 *
 */
When(/^(I |we )*wait until (\d+) elements? match(?:es)? "([^"]*)"$/, async function (pronounCase, count, selector) {
  const expected = parseInt(count, 10);
  try {
    await this.page.waitForFunction(
      ({ sel, n }) => document.querySelectorAll(sel).length === n,
      { sel: selector, n: expected }, { timeout: 10000, polling: 100 }
    );
  } catch (e) {
    if (!isTimeout(e)) throw e;
    const actual = await this.page.locator(selector).count().catch(() => 0);
    throw failure(this.page, `Expected ${expected} element(s) matching "${selector}" within 10 seconds.`, {
      found: `${actual} element(s)`,
      hint: `"${selector}" is a CSS selector; hidden elements count too. For a minimum, use: I wait until at least ${expected} elements match "${selector}"`,
    });
  }
});

/**
 * Wait until at least N elements match a CSS selector.
 *
 * Useful for infinite-scroll / pagination tests where the lower bound matters
 * but the exact count may vary.
 *
 * Example #1: When I wait until at least 3 elements match ".item"
 * Example #2: When I wait until at least 1 element matches ".notification"
 * Example #3: And I wait until at least 10 elements match ".feed-item"
 * Example #4: When we wait until at least 5 elements match "tr"
 * Example #5: When I scroll to the bottom
 *               And I wait until at least 25 elements match ".product-card"
 *
 */
When(/^(I |we )*wait until at least (\d+) elements? match(?:es)? "([^"]*)"$/, async function (pronounCase, count, selector) {
  const expected = parseInt(count, 10);
  try {
    await this.page.waitForFunction(
      ({ sel, n }) => document.querySelectorAll(sel).length >= n,
      { sel: selector, n: expected }, { timeout: 10000, polling: 100 }
    );
  } catch (e) {
    if (!isTimeout(e)) throw e;
    const actual = await this.page.locator(selector).count().catch(() => 0);
    throw failure(this.page, `Expected at least ${expected} element(s) matching "${selector}" within 10 seconds.`, {
      found: `${actual} element(s)`,
      hint: `"${selector}" is a CSS selector; hidden elements count too.`,
    });
  }
});

/**
 * Wait until the network goes quiet (full smart settle, 10 s budget).
 *
 * Three equivalent phrasings.
 *
 * Example #1: When I wait until the network is idle
 * Example #2: And I wait until requests are complete
 * Example #3: When we wait until network goes quiet
 * Example #4: When I press "Search"
 *               And I wait until the network is idle
 *               Then I should see "Results"
 * Example #5: When I press "Refresh"
 *               And I wait until requests are complete
 *
 */
When(/^(I |we )*wait until (the network is idle|requests are complete|network goes quiet)$/, async function (pronounCase, phrasing) {
  await smartSettle(this.page, 10000);
});

/**
 * Wait until the page is interactive (DOMContentLoaded + body attached).
 *
 * Lighter than `wait until the network is idle` — does not wait for late
 * fetch/XHR. Useful when you need to interact with the document early.
 *
 * Example #1: When I wait until the page is interactive
 * Example #2: Given I am on "/heavy-page"
 *               When I wait until the page is interactive
 * Example #3: And I wait until the page is interactive
 * Example #4: When we wait until the page is interactive
 * Example #5: Given I am on "/spa"
 *               When I wait until the page is interactive
 *               Then "<#root>" should be attached
 *
 */
When(/^(I |we )*wait until( the)* page is interactive$/, async function (pronounCase, theCase) {
  await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
});

/**
 * Wait until every tracked `setTimeout` callback due within the step's 10
 * seconds has fired. A timer due later (an hourly update check, a session
 * timeout) is not waited for: it would only use up the budget.
 *
 * Catches "fade-out then display:none" close transitions, debounced renders,
 * and any UI flow that schedules a delayed update without making a network
 * request. Reads the timers kept by webship.js's init script
 * (`window.__webshipTimersDueBy`).
 *
 * Under a fake clock (`Given the system time is "…"`, or a clock step that
 * installed one) the page's timers belong to the clock and run only when it
 * moves, so the step fails at once and says so: advance the clock instead.
 *
 * Example #1: When I wait until pending timers settle
 * Example #2: When I press "Close"
 *               And I wait until pending timers settle
 *               Then I should not see the modal
 * Example #3: And I wait until pending timers settle
 * Example #4: When we wait until pending timers settle
 * Example #5: When I press "Toast"
 *               And I wait until pending timers settle
 *               Then I should not see "Saved"
 *
 */
When(/^(I |we )*wait until pending timers settle$/, async function (pronounCase) {
  const fakeClock = await this.page.evaluate(() => !!(window.Date && window.Date.isFake)).catch(() => false);
  if (fakeClock) {
    throw failure(this.page, 'A fake clock is installed, so the timers of the page run only when the clock moves.', {
      hint: 'advance the clock past the timers instead, for example: When I advance the clock by 5 seconds',
    });
  }
  // The end of the 10 seconds in the page's time, which its timers' due times
  // are kept by (a browser on another machine may keep another).
  const until = Date.now() + 10000 + await pageClockOffset(this.page);
  // Polled from Node: a poll on the page's own setTimeout would be counted as
  // one more pending timer, and the wait could never see the count reach zero.
  const settled = await pollPage(
    this.page,
    (end) => {
      const t = typeof window.__webshipTimersDueBy === 'function' ? window.__webshipTimersDueBy(end) : window.__webshipPendingTimers;
      return typeof t !== 'number' || t <= 0;
    },
    until, 10000, 100
  );
  if (!settled) {
    throw friendly({
      action: 'wait until pending timers settle',
      cause: 'the page still had a pending timer after 10 seconds',
      hint: 'a page that reschedules a timer forever never settles; wait for the element or the text you expect instead.',
    });
  }
});

/**
 * Text assertion that waits longer: `I should see` with a budget of its own,
 * 10 seconds unless the step says "within N seconds".
 *
 * It reads the page exactly as `I should see` and `I should not see` do: the
 * text of the page as Playwright's text matching reads it, letter case
 * ignored, runs of white space collapsed, the text of hidden elements
 * included, the text of `<script>` and `<style>` left out. For the text a
 * visitor can see, with its letter case, use `I wait for the text "..." to
 * appear`.
 *
 * Use sparingly; prefer explicit edge waits (`wait for "X" to appear`).
 *
 * Example #1: Then eventually I should see "Done"
 * Example #2: Then eventually I should see "Loaded" within 5 seconds
 * Example #3: And eventually we should see "Saved"
 * Example #4: Then eventually I should see "Order Confirmed" within 30 seconds
 * Example #5: When I press "Submit"
 *               Then eventually I should see "Submitted" within 8 seconds
 *
 */
When(/^eventually (I |we )*should see "([^"]*)"(?: within (\d+) seconds?)?$/, OWN_LENGTH, async function (pronoun, text, seconds) {
  const total = (seconds ? Math.max(1, parseInt(seconds, 10)) : 10) * 1000;
  try {
    await withinTimeLimit(total, `The wait for the text "${text}"`, () => pageTextLocator(this.page, text).waitFor({ state: 'attached', timeout: total }));
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `The text "${text}" did not appear within ${total / 1000} seconds.`, {
      hint: 'check the spelling; like "I should see", the step ignores letter case and reads all the text of the page, the text of hidden elements included. For a longer wait, add "within N seconds" to the step.',
    });
  }
});

module.exports = { OWN_LENGTH, withinTimeLimit };
