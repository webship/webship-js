const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');


/**
 * Asserting a text in the page.
 * 
 * Example:
 * - Then I should see "Welcome"
 * - Then I should not see "Access denied"
 * 
 * @Then /^I should( not)* see "([^"]*)?"$/
 */
Then(/^I should( not)* see "([^"]*)?"$/, function(negativeCase, expectedText) {
  if (negativeCase) {
    return browser.assert.not.textContains('body', expectedText);
  }
  
  return browser.assert.textContains('body', expectedText);
});

/**
 * Opens homepage.
 * Example: Given I am on "/"
 * 
 * @Given /^I am on( the)* homepage$/
 */
 Given(/^I am on( the)* homepage$/, function(url) {
  return browser.url(url);
});

/**
 * Opens homepage
 * Example: When I go to the homepage
 * Example: And I go to "/"
 *
 * @When /^ I go to( the)* homepage$/
 */
 When(/^ I go to( the)* homepage$/, function(url) {
    return browser.url('/');
  });

/**
 * Opens specified page
 * Example: Given I am on "https://webship.co"
 *
 * @Given /^I go to "([^"]*)?"$/
 */
 Given(/^I go to "([^"]*)?"$/, function(url) {
  return browser.url(url);
});

/**
 * Opens specified page
 * Example: And I am on "https://webship.co"
 * Example: When I go to "https://webship.co"
 *
 * @When /^I go to "([^"]*)?"$/
 */
 When(/^I go to "([^"]*)?"$/, function(url) {
  return browser.url(url);
});

/**
 * Reloads current page
 * Example: When I reload the page
 * Example: And I reload the page
 *
 * @When /^I reload( the)* page$/
 */
 When(/^I reload( the)* page$/, function() {
  return location.reload();
});

/**
 * Moves backward one page in history
 * Example: When I move backward one page
 *
 * @When /^I move backward one page$/
 */
 When(/^I move backward one page$/, function() {
  return history.back();
});

/**
 * Moves forward one page in history
 * Example: And I move forward one page
 *
 * @When /^I move forward one page$/
 */
 When(/^I move forward one page$/, function() {
  return history.forward();
});

/**
 * Presses button with specified id|name|title|alt|value
 * Example: When I press "Log In"
 * Example: And I press "Log In"
 *
 * @When /^I press "([^"]*)?"$/
 */
 When(/^I press "([^"]*)?"$/, function(button) {
  return getButtonByValue(button).click();
});

/**
 * Clicks link with specified id|title|alt|text
 * Example: When I follow "Log In"
 * Example: And I follow "Log In"
 *
 * @When /^I follow "([^"]*)?"$/
 */
 When(/^I follow "([^"]*)?"$/, function(link) {
  return getLinkByValue(link).click();
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: When I fill in "username" with: "bwayne"
 *
 * @When /^I fill in "([^"]*)?" with "([^"]*)?"$/
 */
 When(/^I fill in "([^"]*)?" with "([^"]*)?"$/, function(field, value) {
  var els = document.getElementsByName(field);
  els[0].value = value;
  return els;
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: When I fill in "username" with:
 *
 * @When /^I fill in "([^"]*)?" with:$/
 */
 When(/^I fill in "([^"]*)?" with:$/, function(field) {
  var els = document.getElementsByName(field);
  els[0].value = '';
  return els;
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: And I fill in "bwayne" for "username"
 *
 * @When /^I fill in "([^"]*)?" for "([^"]*)?"$/
 */
 When(/^I fill in "([^"]*)?" for "([^"]*)?"$/, function(value, field) {
  var els = document.getElementsByName(field);
  els[0].value = value;
  return els;
});

/**
 * Fills in form fields with provided table
 * Example: When I fill in the following"
 *              | username | bruceWayne |
 *              | password | iLoveBats123 |
 * Example: And I fill in the following"
 *              | username | bruceWayne |
 *              | password | iLoveBats123 |
 *
 * @When /^I fill in the following:$/
 */
 When(/^I fill in the following:$/, function(table) {
  var tableEle = [];
  table.rows().forEach(row => {
  
    var els = document.getElementsByName(row[0]); 
    els[0].value = row[1];
    tableEle.push(els);
  });
  return tableEle;
});
 



/**
 * -----------------------------------------------------
 * Functions
 * -----------------------------------------------------
 */

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

/**
 * Link object 
 *
 * Find link object by text and value and return. 
 */
 function getLinkByValue(value) {
  var els = document.getElementsByTagName('a');

  for (var i = 0, length = els.length; i < length; i++) {
      var el = els[i];

      if (el.text == value) {
        return el;
          break;
      }
  }
}