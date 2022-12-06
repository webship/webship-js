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

/**
 * Opens specified page
 * Example: And I am on "https://webship.co"
 * Example: When I go to "https://webship.co"
 *
 * @When /^(?:|I )go to "(?P<page>[^"]+)"$/
 */
 Given(/^(?:|I )go to "(?P<page>[^"]+)"$/, function(url) {
  return browser.url(url);
});

/**
 * Reloads current page
 * Example: When I reload the page
 * Example: And I reload the page
 *
 * @When /^(?:|I )reload the page$/
 */
 When(/^(?:|I ) reload (?:|the )page$/, function() {
  return location.reload();
});

/**
 * Moves backward one page in history
 * Example: When I move backward one page
 *
 * @When /^(?:|I )move backward one page$/
 */
 When(/^(?:|I )move backward one page$/, function() {
  return history.back();
});

/**
 * Moves forward one page in history
 * Example: And I move forward one page
 *
 * @When /^(?:|I )move forward one page$/
 */
 When(/^(?:|I )move forward one page$/, function() {
  return history.forward();
});

/**
 * Presses button with specified id|name|title|alt|value
 * Example: When I press "Log In"
 * Example: And I press "Log In"
 *
 * @When /^(?:|I )press "(?P<button>(?:[^"]|\\")*)"$/
 */
 When(/^(?:|I )press "(?P<button>(?:[^"]|\\")*)"$/, function(Button) {
  return getButtonByValue(Button).click();
});






/**
 * Button object 
 *
 * Find button object by type and value and return. 
 */
function getButtonByValue(value) {
  var els = document.getElementsByTagName('input');

  for (var i = 0, length = els.length; i < length; i++) {
      var el = els[i];

      if (el.type.toLowerCase() == 'button' && el.value.toLowerCase() == value.toLowerCase()) {
          return el;
          break;
      }
  }
}