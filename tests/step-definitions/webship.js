const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');
const { endsWith } = require('lodash');

const request = require('request');

/**
 * Opens homepage.
 * Example: Given I am on homepage
 * Example: Given I am on the homepage
 * 
 * @Given /^I am on( the)* homepage$/
 */
Given(/^(I am|we are) on( the)* homepage$/, function (pronoundCase, theCase) {
  return browser.url(browser.launch_url);
});

/**
 * Open specific page
 * Example: Given I am on "about-us.html"
 *
 * @Given /^I am on "([^"]*)?"$/
 */
Given(/^(I am|we are) on "([^"]*)?"$/, function (pronoundCase, url) {
  return browser.url(browser.launch_url + url);
});

/**
 * Go to homepage
 * Example: When I go to the homepage
 * Example: And I go to "/"
 *
 * @When /^I go to( the)* homepage$/
 */
When(/^(I|we)* go to( the)* homepage$/, function (pronoundCase, theCase) {
  return browser.url(browser.launch_url);
});

/**
 * Go to specific page
 * Example: When I go to "contact-us.html"
 *
 * @When /^I go to "([^"]*)?"$/
 */
When(/^(I|we)* go to "([^"]*)?"$/, function (pronoundCase, url) {
  return browser.url(browser.launch_url + url);
});

/**
 * Asserting a text in the page.
 * 
 * Example:
 * - Then I should see "Welcome"
 * - Then I should not see "Access denied"
 * 
 * @Then /^I should( not)* see "([^"]*)?"$/
 */
Then(/^(I|we)* should( not)* see "([^"]*)?"$/, function (pronoundCase, negativeCase, expectedText) {
  return browser.assert.elementContainsText(negativeCase, expectedText, "html");
});

/**
 * Moves forward one page in history
 * Example: When I move forward one page
 *
 * @When /^I move forward one page$/
 */
When(/^(I|we)* move forward one page$/, function (pronoundCase) {
  return browser.forward();
});

/**
 * Moves backward one page in history
 * Example: When I move backward one page
 *
 * @When /^I move backward one page$/
 */
When(/^(I|we)* move backward one page$/, function (pronoundCase) {
  return browser.back();
});

/**
 * Presses button with specified id|class|name|value
 * Example: When I press "Log In"
 * Example: And I press "Log In"
 *
 * @When /^I press "([^"]*)?"$/
 */
When(/^(I|we)* press "([^"]*)?"$/, function (pronoundCase, elementValue) {
  return browser.press(elementValue);
});

/**
 * Clicks link with specified id|class|name|text
 * Example: When I click "Contact Us"
 * Example: And I click "aboutUs"
 *
 * @When /^I click "([^"]*)?"$/
 */
When(/^(I|we)* click "([^"]*)?"$/, function (pronoundCase, item) {
  browser.clickLink(item);
});

/**
 * Reloads current page
 * Example: When I reload the page
 * Example: And I reload the page
 *
 * @When /^I reload( the)* page$/
 */
When(/^(I|we)* reload( the)* page$/, function (pronoundCase, theCase) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Define the step of filling values in the form field specified by id|class|name|label.
 * Example: When I fill in "Username" with "John Smith"
 *
 * @When /^I fill in "([^"]*)?" with "([^"]*)?"$/
 */
When(/^(I|we)* fill in "([^"]*)?" with "([^"]*)?"$/, function (pronoundCase, field, value) {
  browser.fillTextInput(field, value);
});

/**
 * Fills in form field with specified id|class|name|label
 * Example: When I fill in "username" with:
 *
 * @When /^I fill in "([^"]*)?" with:$/
 */
When(/^(I|we)* fill in "([^"]*)?" with:$/, function (pronoundCase, field) {
  browser.fillTextInput(field, '');
});

/**
 * Fills in form field with specified id|class|name|label
 * Example: And I fill in "webshipco" for "username"
 *
 * @When /^I fill in "([^"]*)?" for "([^"]*)?"$/
 */
When(/^(I|we)* fill in "([^"]*)?" for "([^"]*)?"$/, function (pronoundCase, value, field) {
  browser.fillTextInput(field, value);
});

/**
 * Fills in form fields with provided table
 * Example: When I fill in the following:
 *              | username | webshipco |
 *              | password | 1234 |
 * Example: And I fill in the following"
 *              | username | webshipco |
 *              | password | 1234 |
 *
 * @When /^I fill in the following:$/
 */
When(/^(I|we)* fill in the following:$/, function (pronoundCase, table) {

  browser.fillTextInput(table.rawTable[0][0], table.rawTable[0][1]);
  table.rows().forEach(row => {
    browser.fillTextInput(row[0], row[1]);
  });
});

/**
 * Selects option in select field with specified id|class|name|label
 * Example: When I select "mercedes" from "Cars"
 *
 * @When /^I select "([^"]*)?" from "([^"]*)?"$/
 */
When(/^(I|we)* select "([^"]*)?" from "([^"]*)?"$/, function (pronoundCase, option, dropdownlist) {
  browser.selectOption(option, dropdownlist);
});

/**
 * Checks checkbox specified by id|class|name|label
 * Example: When I check "Remember me"
 *
 * @When /^I check "([^"]*)?"$/
 */
When(/^(I|we)* check "([^"]*)?"$/, function (pronoundCase, item) {
  browser.checkItem(item);
});

/**
 * Unchecks checkbox specified by id|class|name|label
 * Example: When I uncheck "Remember me"
 *
 * @When /^I uncheck "([^"]*)?"$/
 */
When(/^(I|we)* uncheck "([^"]*)?"$/, function (pronoundCase, item) {
  browser.uncheckItem(item);
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should be on the homepage
 *
 * @Then /^I should be on( the)* homepage$/
 */
Then(/^(I|we)* should( not)* be on( the)* homepage$/, function (pronoundCase, negativeCase, theCase) {
  return browser.assert.backToHomepage(negativeCase);
});

/**
 * Verify, that current page path is equal to specified
 * Example: Then I should be on "/"
 * Example: And I should be on "/user/login"
 * Example: And I should be on "http://google.com"
 *
 * @Then /^I should be on "([^"]*)?"$/
 */
Then(/^(I|we)* should be on "([^"]*)?"$/, function (pronoundCase, url) {
  return browser.assert.urlContains(url);
});

/**
 * Checks, that HTML response contains specific text specified by id|class|name|label
 * Example: Then the response should contain "Welcome visitor, How can I help you?"
 * Example: Then the response should not contain "Error: Ambiguous messages that are unclear"
 *
 * @Then /^the response should contain "([^"]*)?"$/
 */
Then(/^the response should( not)* contain "([^"]*)?"$/, function (negativeCase, expectedText) {
  return browser.assert.elementContainsText(negativeCase, expectedText, 'html');
});

/**
 * Assert, that element contains a specific text value specified by id|class|name|label
 * Example: Then I should see "John Smith" in the "Username" element
 * Example: Then I should see "Joe Smith" in the "Username" element
 *
 * @Then /^I should( not)* see "([^"]*)?" in the "([^"]*)?" element$/
 */
Then(/^(I|we)* should( not)* see "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, negativeCase, expectedText, element) {
  return browser.assert.elementContainsText(negativeCase, expectedText, element);
});

/**
 * Assert, that element exists on page specified by id|class|name|label
 * Example: Then I should see a "body" element
 * Example: Then I should see an "Email" element
 * Example: Then I should not see a "Username" element
 * Example: Then I should not see an "img" element
 *
 * @Then /^I should( not)* see a(n)* "([^"]*)?" element$/
 */
Then(/^(I|we)* should( not)* see a(n)* "([^"]*)?" element$/, function (pronoundCase, negativeCase, identification, element) {
  return browser.assert.shouldVisible(negativeCase, element);
});

/**
 * Assert, that element contains a specific CSS style specified by id|class|name|label|tag.
 * Example: Then the "body" element should contain "color:white;"
 *
 * @Then /^the "([^"]*)?" element should( not)* contain "([^"]*)?"$/
 */
Then(/^the "([^"]*)?" element should( not)* contain "([^"]*)?"$/, function (element, negativeCase, elementCss) {
  return browser.assert.elementContainsCss(element, negativeCase, elementCss);
});

/**
 * Attaches file to field with specified id|class|name|label
 * Example: When I attach the file "profileIcon.jpg" to "profileIconUpload"
 *
 * @When /^I attach the file "([^"]*)?" to "([^"]*)?"$/
 */
When(/^(I|we)* attach the file "([^"]*)?" to "([^"]*)?"$/, function (pronoundCase, fileUrl, element) {
  browser.fileUpload("../../../tests/assets/" + fileUrl, element);
});

/**
 * Assert, that form field with specified id|class|name|label has specified value
 * Example: Then the "username" field should contain "John Smith"
 *
 * @Then /^the "([^"]*)?" field should( not)* contain "([^"]*)?"$/
 */
Then(/^the "([^"]*)?" field should( not)* contain "([^"]*)?"$/, function (field, negativeCase, expectedText) {
  return browser.assert.elementContainsText(negativeCase, expectedText, field);
});

/**
 * Assert, that checkbox with specified id|class|name|label is should be checked
 * Example: Then the "PrivacyPolicy" checkbox should be checked
 *
 * @Then /^the "([^"]*)?" checkbox should(not)* be checked$/
 * 
 */
Then(/^the "([^"]*)?" checkbox should( not)* be checked$/, function (checkbox, negativeCase) {
  return browser.assert.checkboxChecked(checkbox, negativeCase);
});

/**
 * Check, whether the checkbox specified by id|class|name|label is checked or not.
 * Example: Then the "Remember Me" checkbox is checked
 *
 * @Then /^the "([^"]*)?" checkbox is( not)* checked$/
 * 
 */
Then(/^the "([^"]*)?" checkbox is( not)* checked$/, function (checkbox, negativeCase) {
  return browser.assert.checkboxChecked(checkbox, negativeCase);
});

/**
 * Assert, that checkbox with specified id|name|label|value is checked
 * Example: Then the checkbox "PrivacyPolicy" should be checked
 * Example: Then the checkbox "PrivacyPolicy" should not be checked
 *
 * @Then /^the checkbox "([^"]*)?" should(not)* be checked$/
 * 
 */
Then(/^the checkbox "([^"]*)?" should( not)* be checked$/, function (checkbox, negativeCase) {
  return browser.assert.checkboxChecked(checkbox, negativeCase);
});

/**
 * Assert, that checkbox with specified id|name|label|value is checked
 * Example: Then the checkbox "Remember Me" is checked
 * Example: And the checkbox "Remember Me" is not checked
 *
 * @Then /^the checkbox "([^"]*)?" is( not)* checked$/
 * 
 */
Then(/^the checkbox "([^"]*)?" is( not)* checked$/, function (checkbox, negativeCase) {
  return browser.assert.checkboxChecked(checkbox, negativeCase);
});

/**
 * Wait a specific number of seconds, or a max number of seconds until the element present.
 * Example: When I wait 1 second
 * Example: When I wait 5 seconds
 * Example: When I wait max of 6 seconds
 *
 * @When /^I wait( max of)* "([^"]*)?" second(s)*$/
 * 
 */
When(/^(I|we)* wait( max of)* (\d*) second(s)*$/, function (pronoundCase, maxof, number, withS) {
  return browser.wait(maxof, number, "s");
});

/**
 * Wait a specific number of minutes, or a max number of minutes until the element present.
 * Example: When I wait 1 minute
 * Example: When I wait 5 minutes
 * Example: When I wait max of 6 minutes
 *
 * @When /^I wait( max of)* "([^"]*)?" minute(s)*$/
 * 
 */
When(/^(I|we)* wait( max of)* (\d*) minute(s)*$/, function (pronoundCase, maxof, number, withS) {
  return browser.wait(maxof, number, "m");
});

/**
 * Checks, that the current page response status is equal or not equal to the specified code
 * Example: Then the response status code should be 200
 * Example: And the response status code should not be 404
 *
 * @Then /^the response status code should( not)* be (?P<code>\d+)$/
 */
Then(/^the response status code should( not)* be (\d+)$/, function (negativeCase, expectedStatusCode) {
  return browser.assert.responseStatus(negativeCase, expectedStatusCode);
});

/**
 * Checks, that page contains text matching specified pattern
 * Example: Then I should see text matching "^T\w+" //pattern of word start with 'T'
 *
 * @Then /^I should see( not)* text matching "([^"]*)?"$/
 */
Then(/^(I|we)* should( not)* see text matching "([^"]*)?"$/, function (pronoundCase, negativeCase, textPattern) {
  // return browser.assert.textMatching(negativeCase, textPattern);
  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      if (negativeCase) {
        return browser.assert.not.textMatches(elementsObj, textPattern);
      }
      return browser.assert.textMatches(elementsObj, textPattern);
    });
  });
});

/**
 * Checks, that page contains text matching specified pattern
 * Example: Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element //pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 * @Then /^I should see( not)* text matching "([^"]*)?" in the "([^"]*)?" element$/
 */
Then(/^(I|we)* should( not)* see text matching "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, negativeCase, textPattern, element) {
  browser.elements('css selector', element, function (elements) {
    elements.value.forEach(function (elementsObj) {
      if (negativeCase) {
        return browser.assert.not.textMatches(elementsObj, textPattern);
      }
      return browser.assert.textMatches(elementsObj, textPattern);
    });
  });
});


/**
 * Checks, that current URL Path matches regular expression
 * Example: Then the url should match "/contact-us.html"
 *
 * @Then /^the url should( not)* match "([^"]*)?"$/
 */
Then(/^the url should( not)* match "([^"]*)?"$/, function (negativeCase, pattern) {

  if (negativeCase) {
    return browser.assert.not.urlMatches(pattern);
  }
  return browser.assert.urlMatches(pattern);

});