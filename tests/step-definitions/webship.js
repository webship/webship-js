const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');

/**
 * Opens homepage.
 * Example: Given I am on "/"
 * 
 * @Given /^(?:|I )am on (?:|the )homepage$/
 */
 Given(/^(?:|I )am on (?:|the )homepage$/, function(url) {
  return browser.url(url);
});
