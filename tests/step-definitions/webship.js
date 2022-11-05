const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');

/**
 * Navigate to a url.
 * 
 * Exmaple:
 *  - Given I go to "https://webship.co"
 */
Given(/^I go to "([^"]*)?"$/, function(url) {
  return browser.url(url);
});

/**
 * Asserting a text in the page.
 * 
 * Exmaple:
 * - Then I should see "Welcome"
 * - Then I should not see "Access denied"
 */
Then(/^I should( not)* see "([^"]*)?"$/, function(negativeCase, expectedText) {
  if (negativeCase) {
    return browser.assert.not.textContains('body', expectedText);
  }
  
  return browser.assert.textContains('body', expectedText);
});