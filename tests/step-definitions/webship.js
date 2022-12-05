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

/**
 * Opens homepage
 * Example: When I go to the homepage
 * Example: And I go to "/"
 *
 * @When /^(?:|I )go to (?:|the )homepage$/
 */
 When(/^(?:|I )go to (?:|the )homepage$/, function(url) {
    return browser.url('/');
  });

/**
 * Opens specified page
 * Example: Given I am on "https://webship.co"
 *
 * @Given /^(?:|I )am on "(?P<page>[^"]+)"$/
 */
 Given(/^(?:|I )am on "(?P<page>[^"]+)"$/, function(url) {
  return browser.url(url);
});




