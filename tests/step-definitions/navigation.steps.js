'use strict';

// All navigation step definitions live in this file: anonymous user, going
// to the homepage / a specific path, browser history (back/forward), reload,
// and URL/path assertions.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { gotoUrl, waitForPageLoad, smartSettle } = require('./webship');

// ---------------------------------------------------------------------------
// Sessions / visits
// ---------------------------------------------------------------------------

/**
 * Clear cookies and navigate to the launch URL as an anonymous visitor.
 *
 * Example #1: Given I am an anonymous user
 * Example #2: Given we are an anonymous user
 * Example #3: Given an anonymous user
 *
 */
Given(/^(I am |we are )?an anonymous user$/, async function (pronounCase) {
  await this.context.clearCookies();
  await gotoUrl(this.page, this.launchUrl);
  await waitForPageLoad(this.page, this.minWaitTime.page || 3000);
});

/**
 * Open the homepage.
 *
 * Example #1: Given I am on homepage
 * Example #2: Given I am on the homepage
 * Example #3: Given I am on frontpage
 * Example #4: Given I am on the frontpage
 * Example #5: Given we are on homepage
 * Example #6: Given we are on the frontpage
 * Example #7: Given on homepage
 * Example #8: Given on the homepage
 * Example #9: Given on frontpage
 * Example #10: Given on the frontpage
 *
 */
Given(/^(I am |we are )?on( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

/**
 * Open a specific page under the launch URL.
 *
 * Example #1: Given I am on "/about-us.html"
 * Example #2: Given I am on the "/about-us.html" page
 * Example #3: Given we are on "/user/login"
 * Example #4: Given we are on the "/contact-us.html" page
 * Example #5: Given on "/about-us.html"
 * Example #6: Given on the "/about-us.html" page
 * Example #7: Given I am on "https://un.org"
 *
 */
Given(/^(I am |we are )*on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, theCase, url, pageCase) {
  await gotoUrl(this.page, this.launchUrl + url);
  await this.page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await waitForPageLoad(this.page);
});

/**
 * Navigate to the homepage.
 *
 * Example #1: When I go to homepage
 * Example #2: When I go to the homepage
 * Example #3: When I navigate to the homepage
 * Example #4: When navigating to the homepage
 * Example #5: When navigating to homepage
 * Example #6: When navigating to the frontpage
 * Example #7: When we go to the homepage
 * Example #8: When we navigate to the homepage
 *
 */
When(/^(I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)$/, async function (pronounCase, theCase, pageCase) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

/**
 * Navigate to a specific page.
 *
 * Example #1: When I go to "/contact-us.html"
 * Example #2: When I go to "/user/login"
 * Example #3: When I navigate to "/admin/dashboard"
 * Example #4: When navigating to "/products"
 * Example #5: When we go to "/products"
 * Example #6: When we navigate to "/terms"
 *
 */
When(/^(I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$/, async function (pronounCase, url) {
  const defaultTime = this.minWaitTime.page || 3000;
  await gotoUrl(this.page, this.launchUrl + url);
  await this.page.waitForSelector('body', { state: 'attached', timeout: defaultTime });
  await waitForPageLoad(this.page, defaultTime);
});

// ---------------------------------------------------------------------------
// Browser history + reload
// ---------------------------------------------------------------------------

/**
 * Moves forward one page in browser history.
 *
 * Example #1: When I move forward one page
 * Example #2: When we move forward one page
 * Example #3: And move forward one page
 *
 */
When(/^(I |we )*move forward one page$/, async function (pronounCase) {
  await this.page.goForward();
});

/**
 * Moves backward one page in browser history.
 *
 * Example #1: When I move backward one page
 * Example #2: When we move backward one page
 * Example #3: And move backward one page
 *
 */
When(/^(I |we )*move backward one page$/, async function (pronounCase) {
  await this.page.goBack();
});

/**
 * Reloads the current page.
 *
 * Example #1: When I reload
 * Example #2: And I reload the page
 * Example #3: And we reload page
 * Example #4: And we reload the page
 *
 */
When(/^(I |we )*reload( the)*( page)*$/, async function (pronounCase, theCase, pageCase) {
  await this.page.reload();
});

// ---------------------------------------------------------------------------
// URL / path assertions
// ---------------------------------------------------------------------------

/**
 * Assert that the current page is or is not the homepage.
 *
 * Example #1: Then I should be on homepage
 * Example #2: And I should be on the homepage
 * Example #3: Then I should be on frontpage
 * Example #4: And should be on the homepage
 * Example #5: Then should be on homepage
 * Example #6: And we should be on homepage
 * Example #7: Then should be on frontpage
 * Example #8: And we should be on the homepage
 * Example #9: Then I should not be on homepage
 * Example #10: And I should not be on the homepage
 *
 */
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

/**
 * Assert that the current path is or is not equal to the specified path.
 *
 * Example #1: Then I should be on "/"
 * Example #2: And I should be on "/user/login"
 * Example #3: And I should be on "https://un.org"
 * Example #4: Then we should be on the "/" page
 * Example #5: And we should be on "/user/login"
 * Example #6: Then should be on the "/user/reset" page
 * Example #7: Then I should not be on "/"
 * Example #8: And I should not be on "/user/login"
 * Example #9: And I should not be on "https://un.org"
 * Example #10: And we should not be on the "https://un.org" page
 *
 */
Then(/^(I |we )*should( not)* be on( the)* "([^"]*)?"( page)*$/, async function (pronounCase, notCase, theCase, url, pageCase) {
  const currentUrl = this.page.url();
  if (notCase) {
    assert.ok(!currentUrl.includes(url), `URL should NOT contain "${url}" but it is: ${currentUrl}`);
  } else {
    assert.ok(currentUrl.includes(url), `URL should contain "${url}" but it is: ${currentUrl}`);
  }
});

/**
 * Assert that the current URL matches or does not match a regex pattern.
 *
 * Example #1: Then the url should match "/contact-us.html"
 * Example #2: Then the url should not match "/contact-us.html"
 * Example #3: And the url should match "^https://"
 *
 */
Then(/^(the )*url should( not)* match "([^"]*)?"$/, async function (theCase, notCase, pattern) {
  const currentUrl = this.page.url();
  const regex = new RegExp(pattern);
  if (notCase) {
    assert.ok(!regex.test(currentUrl), `URL "${currentUrl}" should NOT match "${pattern}" but it does.`);
  } else {
    assert.ok(regex.test(currentUrl), `URL "${currentUrl}" should match "${pattern}" but it does not.`);
  }
});
