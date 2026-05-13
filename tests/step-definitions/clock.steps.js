'use strict';

const { friendly } = require('./webship');

// Clock / time-mocking steps backed by Playwright's `page.clock` API.

const { Given, When } = require('@cucumber/cucumber');

const ISO_HINT = 'install the fake clock first via "Given the system time is \\"YYYY-MM-DDTHH:MM:SSZ\\"".';

/**
 * Install a fake clock anchored at an ISO 8601 instant.
 *
 * Example #1: Given the system time is "2026-05-08T10:00:00Z"
 * Example #2: Given the system time is "2026-01-01T00:00:00Z"
 * Example #3: Given the system time is "2026-12-31T23:59:55Z"
 * Example #4: Given the system time is "2026-05-08T10:00:00Z"
 * Example #5: Given the system time is "2026-07-04T12:00:00-04:00"
 *
 */
Given(/^the system time is "([^"]*)"$/, async function (iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    throw friendly({
      action: `set the system time to "${iso}"`,
      hint: 'use an ISO 8601 date like "2026-05-08T10:00:00Z".',
    });
  }
  try { await this.page.clock.install({ time: d }); }
  catch (e) { throw friendly({ action: `install a fake clock at "${iso}"`, cause: e, hint: 'open a page first via "Given I am on \\"/path\\"".' }); }
});

/**
 * Advance the fake clock forward by N milliseconds.
 *
 * Example #1: When I advance the clock by 500 ms
 * Example #2: When I advance the clock by 1500 ms
 * Example #3: When we advance the clock by 250 ms
 * Example #4: And I advance the clock by 100 ms
 * Example #5: When I advance the clock by 60000 ms
 *
 */
When(/^(I |we )*advance the clock by (\d+) ?ms$/, async function (pronoun, ms) {
  try { await this.page.clock.runFor(parseInt(ms, 10)); }
  catch (e) { throw friendly({ action: `advance the clock by ${ms} ms`, cause: e, hint: ISO_HINT }); }
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
  try { await this.page.clock.runFor(parseInt(seconds, 10) * 1000); }
  catch (e) { throw friendly({ action: `advance the clock by ${seconds} second(s)`, cause: e, hint: ISO_HINT }); }
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
  try { await this.page.clock.runFor(parseInt(minutes, 10) * 60 * 1000); }
  catch (e) { throw friendly({ action: `advance the clock by ${minutes} minute(s)`, cause: e, hint: ISO_HINT }); }
});

/**
 * Pause the fake clock.
 *
 * Example #1: When I pause the clock
 * Example #2: When I pause the clock
 * Example #3: When we pause the clock
 * Example #4: And I pause the clock
 * Example #5: When I pause the clock
 *
 */
When(/^(I |we )*pause the clock$/, async function () {
  try { await this.page.clock.pauseAt(await this.page.evaluate(() => Date.now())); }
  catch (e) { throw friendly({ action: 'pause the clock', cause: e, hint: ISO_HINT }); }
});

/**
 * Resume the fake clock.
 *
 * Example #1: When I resume the clock
 * Example #2: When I resume the clock
 * Example #3: When we resume the clock
 * Example #4: And I resume the clock
 * Example #5: When I resume the clock
 *
 */
When(/^(I |we )*resume the clock$/, async function () {
  try { await this.page.clock.resume(); }
  catch (e) { throw friendly({ action: 'resume the clock', cause: e, hint: 'pause the clock first via "When I pause the clock".' }); }
});

/**
 * Set the fake clock to a specific time.
 *
 * Example #1: When I set the system time to "2026-05-08T12:30:00Z"
 * Example #2: When I set the system time to "2026-12-31T23:59:55Z"
 * Example #3: When we set the system time to "2026-01-01T00:00:00Z"
 * Example #4: And I set the system time to "2026-07-04T08:00:00-04:00"
 * Example #5: When I set the system time to "2027-01-01T00:00:00Z"
 *
 */
When(/^(I |we )*set the system time to "([^"]*)"$/, async function (pronoun, iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    throw friendly({
      action: `set the system time to "${iso}"`,
      hint: 'use an ISO 8601 date like "2026-05-08T12:30:00Z".',
    });
  }
  try { await this.page.clock.setSystemTime(d); }
  catch (e) { throw friendly({ action: `set the system time to "${iso}"`, cause: e, hint: ISO_HINT }); }
});
