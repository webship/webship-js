const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');

/**
 * some description
 * for first given function
 */
Given(/^I go to "([^"]*)?"$/, (url) => browser.url(url));

Then(/^I should( not)* see "([^"]*)?"$/, (negativeCase, expectedText) => {
  if (negativeCase) {
    return browser.assert.not.textContains('body', expectedText);
  }

  return browser.assert.textContains('body', expectedText);
});
