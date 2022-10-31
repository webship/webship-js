const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');

/**
 * webship.js step definitions
 * inside webship-js backage
 */
Given(/^I go to "([^"]*)?"$/, (url) => browser.url(url));

Then(/^I should( not)* see "([^"]*)?"$/, (negativeCase, expectedText) => {
  if (negativeCase) {
    return browser.assert.not.textContains('body', expectedText);
  }

  return browser.assert.textContains('body', expectedText);
});
