'use strict';

// Clock / time-mocking steps backed by Playwright's `page.clock` API.
//
// Useful for testing relative-time UIs ("5 minutes ago"), debounced inputs,
// throttled re-renders, scheduled UI changes (toast auto-dismiss, session
// timeout), and any flow gated on `Date.now()` or `setTimeout`.
//
// Once the fake clock is installed, page-level `Date.now()` and `new Date()`
// return the fake time, and pending timers stay paused until explicitly
// advanced.

const { Given, When } = require('@cucumber/cucumber');

/**
 * Install a fake clock anchored at an ISO 8601 instant.
 *
 * After this step, `Date.now()` inside the page returns the fake time and
 * `setTimeout` / `setInterval` callbacks queue but do not fire until you
 * advance the clock.
 *
 * Example #1: Given the system time is "2026-05-08T10:00:00Z"
 * Example #2: Given the system time is "2026-01-01T00:00:00Z"
 *               And I am on "/feed"
 * Example #3: Given the system time is "2026-12-31T23:59:55Z"
 *               And I am on "/countdown"
 * Example #4: Given the system time is "2026-05-08T10:00:00Z"
 *               And I am on "/feed"
 *               And "<.timestamp>" should have text "just now"
 * Example #5: Given the system time is "2026-07-04T12:00:00-04:00"
 *               And I am on "/holiday-banner"
 *
 */
Given(/^the system time is "([^"]*)"$/, async function (iso) {
  await this.page.clock.install({ time: new Date(iso) });
});

/**
 * Advance the fake clock forward by N milliseconds, firing every queued
 * `setTimeout` / `setInterval` callback scheduled within that interval.
 *
 * Example #1: When I advance the clock by 500 ms
 * Example #2: When I advance the clock by 1500 ms
 * Example #3: When we advance the clock by 250 ms
 * Example #4: And I advance the clock by 100 ms
 * Example #5: When I advance the clock by 60000 ms
 *
 */
When(/^(I |we )*advance the clock by (\d+) ?ms$/, async function (pronoun, ms) {
  await this.page.clock.runFor(parseInt(ms, 10));
});

/**
 * Advance the fake clock forward by N seconds.
 *
 * Example #1: When I advance the clock by 30 seconds
 * Example #2: When I advance the clock by 5 seconds
 * Example #3: When we advance the clock by 1 second
 * Example #4: And I advance the clock by 10 seconds
 * Example #5: When I advance the clock by 90 seconds
 *
 */
When(/^(I |we )*advance the clock by (\d+) seconds?$/, async function (pronoun, seconds) {
  await this.page.clock.runFor(parseInt(seconds, 10) * 1000);
});

/**
 * Advance the fake clock forward by N minutes.
 *
 * Example #1: When I advance the clock by 5 minutes
 * Example #2: When I advance the clock by 1 minute
 * Example #3: When we advance the clock by 14 minutes
 * Example #4: And I advance the clock by 30 minutes
 * Example #5: When I advance the clock by 60 minutes
 *
 */
When(/^(I |we )*advance the clock by (\d+) minutes?$/, async function (pronoun, minutes) {
  await this.page.clock.runFor(parseInt(minutes, 10) * 60 * 1000);
});

/**
 * Pause the fake clock — no further timer callbacks fire until resumed or
 * explicitly advanced. Useful between actions when you do not want a long
 * tick to fire mid-step.
 *
 * Example #1: When I pause the clock
 * Example #2: Given the system time is "2026-05-08T10:00:00Z"
 *               When I pause the clock
 * Example #3: When we pause the clock
 * Example #4: And I pause the clock
 * Example #5: When I pause the clock
 *               Then "<.timer>" should have text "00:00"
 *
 */
When(/^(I |we )*pause the clock$/, async function () {
  await this.page.clock.pauseAt(await this.page.evaluate(() => Date.now()));
});

/**
 * Resume the fake clock from the current paused time.
 *
 * Example #1: When I resume the clock
 * Example #2: When I pause the clock
 *               And I resume the clock
 * Example #3: When we resume the clock
 * Example #4: And I resume the clock
 * Example #5: When I resume the clock
 *               And I advance the clock by 5 seconds
 *
 */
When(/^(I |we )*resume the clock$/, async function () {
  await this.page.clock.resume();
});

/**
 * Set the fake clock to a specific time WITHOUT advancing through it. Use
 * `advance` if you want pending timers in the gap to fire.
 *
 * Example #1: When I set the system time to "2026-05-08T12:30:00Z"
 * Example #2: When I set the system time to "2026-12-31T23:59:55Z"
 * Example #3: When we set the system time to "2026-01-01T00:00:00Z"
 * Example #4: And I set the system time to "2026-07-04T08:00:00-04:00"
 * Example #5: When I set the system time to "2027-01-01T00:00:00Z"
 *
 */
When(/^(I |we )*set the system time to "([^"]*)"$/, async function (pronoun, iso) {
  await this.page.clock.setSystemTime(new Date(iso));
});
