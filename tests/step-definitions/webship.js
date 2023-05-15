const { Given } = require('@cucumber/cucumber');
const { When, Before } = require('@cucumber/cucumber');
const { Then } = require('@cucumber/cucumber');

/**
 * Opens homepage.
 * 
 * Example: Given I am on homepage
 * Example: Given I am on the homepage
 * 
 * @Given /^I am on( the)* homepage$/
 */
Given(/^I am on( the)* homepage$/, function (url) {
  return browser.url(browser.launch_url);
});

/**
 * Opens specified page
 * Example: Given I am on "about-us.html"
 *
 * @Given /^I am on "([^"]*)?"$/
 */
Given(/^I am on "([^"]*)?"$/, function (url) {
  return browser.url(browser.launch_url + url);
});

/**
 * Opens homepage
 * Example: When I go to the homepage
 * Example: And I go to "/"
 *
 * @When /^I go to( the)* homepage$/
 */
When(/^I go to( the)* homepage$/, function () {
  return browser.url(browser.launch_url);
});

/**
 * Opens specified page
 * Example: When I go to "contact-us.html"
 *
 * @When /^I go to "([^"]*)?"$/
 */
When(/^I go to "([^"]*)?"$/, function (url) {
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
Then(/^I should( not)* see "([^"]*)?"$/, function (negativeCase, expectedText) {
  if (negativeCase) {
    return browser.assert.not.textContains('html', expectedText);
  }

  return browser.assert.textContains('html', expectedText);
});

/**
 * Moves forward one page in history
 * Example: And I move forward one page
 *
 * @When /^I move forward one page$/
 */
When(/^I move forward one page$/, function () {
  return browser.forward();
});

/**
 * Moves backward one page in history
 * Example: When I move backward one page
 *
 * @When /^I move backward one page$/
 */
When(/^I move backward one page$/, function () {
  return browser.back();
});

/**
 * Presses button with specified id|name|title|alt|value
 * Example: When I press "Log In"
 * Example: And I press "Log In"
 *
 * @When /^I press "([^"]*)?"$/
 */
When(/^I press "([^"]*)?"$/, function (elementValue) {
  return browser.click("[value='" + elementValue + "']");
  // return browser.smartPressButton(elementValue);
});

/**
 * Clicks link with specified id|title|alt|text
 * Example: When I follow "Log In"
 * Example: And I follow "Log In"
 *
 * @When /^I follow "([^"]*)?"$/
 */
When(/^I follow "([^"]*)?"$/, function (elementValue) {
  browser.click("link text", elementValue);
  // return browser.smartLinkClick(elementValue);
});

/**
 * Reloads current page
 * Example: When I reload the page
 * Example: And I reload the page
 *
 * @When /^I reload( the)* page$/
 */
When(/^I reload( the)* page$/, function (url) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: When I fill in "username" with "webshipco"
 *
 * @When /^I fill in "([^"]*)?" with "([^"]*)?"$/
 */
When(/^I fill in "([^"]*)?" with "([^"]*)?"$/, function (field, value) {
  browser.smartFillTextInput(field, value);
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: When I fill in "username" with:
 *
 * @When /^I fill in "([^"]*)?" with:$/
 */
When(/^I fill in "([^"]*)?" with:$/, function (field) {
  browser.smartFillTextInput(field, '');
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: And I fill in "webshipco" for "username"
 *
 * @When /^I fill in "([^"]*)?" for "([^"]*)?"$/
 */
When(/^I fill in "([^"]*)?" for "([^"]*)?"$/, function (value, field) {
  browser.smartFillTextInput(field, value);
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
When(/^I fill in the following:$/, function (table) {

  browser.smartFillTextInput(table.rawTable[0][0], table.rawTable[0][1]);
  table.rows().forEach(row => {
    browser.smartFillTextInput(row[0], row[1]);
  });
});

/**
 * Selects option in select field with specified id|name|label|value
 * Example: When I select "saab" from "Cars"
 * Example: And I select "saab" from "Cars"
 *
 * @When /^I select "([^"]*)?" from "([^"]*)?"$/
 */
When(/^I select "([^"]*)?" from "([^"]*)?"$/, function (option, selectBox) {
  browser.smartSelectOption(option, selectBox);
});

/**
* Checks checkbox with specified id|name|label|value
* Example: When I check "Pearl Necklace"
* Example: And I check "Pearl Necklace"
*
* @When /^I check "([^"]*)?"$/
*/
When(/^I check "([^"]*)?"$/, function (item) {
  browser.smartCheckItem(item);
});

/**
* Unchecks checkbox with specified id|name|label|value
* Example: When I uncheck "Broadway Plays"
* Example: And I uncheck "Broadway Plays"
*
* @When /^I uncheck "([^"]*)?"$/
*/
When(/^I uncheck "([^"]*)?"$/, function (item) {
  browser.smartUncheckItem(item);
});

/**
* Checks, that current page is the homepage
* Example: Then I should be on the homepage
* Example: And I should be on the homepage
*
* @Then /^I should be on( the)* homepage$/
*/
Then(/^I should be on( the)* homepage$/, function (url) {
  return browser.assert.urlEquals(browser.launch_url);
});

/**
* Checks, that current page PATH is equal to specified
* Example: Then I should be on "/"
* Example: And I should be on "/bats"
* Example: And I should be on "http://google.com"
*
* @Then /^I should be on "([^"]*)?"$/
*/
Then(/^I should be on "([^"]*)?"$/, function (url) {
  return browser.assert.urlContains(url);
});

/**
* Checks, that HTML response contains specified string
* Example: Then the response should contain "Batman is the hero Gotham deserves."
* Example: And the response should contain "Batman is the hero Gotham deserves."
*
* @Then /^the response should contain "([^"]*)?"$/
*/
Then(/^the response should( not)* contain "([^"]*)?"$/, function (negativeCase, expectedText) {
  if (negativeCase) {
    return browser.assert.not.textContains('html', expectedText);
  }

  return browser.assert.textContains('html', expectedText);
});

/**
* Checks, that element with specified CSS contains specified text
* Example: Then I should see "Batman" in the "heroes_list" element
* Example: And I should see "Batman" in the "heroes_list" element
*
* @Then /^I should( not)* see "([^"]*)?" in the "([^"]*)?" element$/
*/
Then(/^I should( not)* see "([^"]*)?" in the "([^"]*)?" element$/, function (negativeCase, expectedText, element) {
  return browser.assert.smartElementContains(negativeCase, expectedText, element);
});

/**
* Checks, that page contains text matching specified pattern
* Example: Then I should see text matching "Bruce Wayne, the vigilante"
* Example: And I should not see "Bruce Wayne, the vigilante"
*
* @Then /^I should( not)* see text matching "([^"]*)?"$/
*/
Then(/^I should( not)* see text matching "([^"]*)?"$/, function (negativeCase, expectedText) {
  if (negativeCase) {
    return browser.assert.not.textContains('html', expectedText);
  }

  return browser.assert.textContains('html', expectedText);
});

/**
 * Checks, that element with specified CSS exists on page
 * Example: Then I should see a "body" element
 * Example: And I should see a "body" element
 *
 * @Then /^I should( not)* see a(n)* "([^"]*)?" element$/
 */
Then(/^I should( not)* see a(n)* "([^"]*)?" element$/, function (negativeCase, identification, element) {
  if (negativeCase) {
    return browser.verify.not.visible(element);
  }
  return browser.verify.visible(element);
});

/**
 * Checks, that element with specified CSS contains specified HTML
 * Example: Then the "body" element should contain "color:black;"
 * Example: And the "body" element should contain "color:black;"
 *
 * @Then /^the "([^"]*)?" element should( not)* contain "([^"]*)?"$/
 */
Then(/^the "([^"]*)?" element should( not)* contain "([^"]*)?"$/, function (element, negativeCase, elementCss) {
  return browser.assert.smartElementContainsCss(element, negativeCase, elementCss);
});

/**
* Attaches file to field with specified id|name|label|value
* Example: When I attach the file "bwayne_profile.png" to "profileImageUpload"
* Example: And I attach the file "bwayne_profile.png" to "profileImageUpload"
*
* @When /^I attach the file "([^"]*)?" to "([^"]*)?"$/
*/
When(/^I attach the file "([^"]*)?" to "([^"]*)?"$/, function (fileUrl, element) {
  browser.smartUploadFile(fileUrl, element);
});

/**
 * Checks, that form field with specified id|name|label|value has specified value
 * Example: Then the "username" field should contain "bwayne"
 * Example: And the "username" field should not contain "bwayne"
 *
 * @Then /^the "([^"]*)?" field should( not)* contain "([^"]*)?"$/
 */
Then(/^the "([^"]*)?" field should( not)* contain "([^"]*)?"$/, function (field, negativeCase, expectedText) {
  return browser.assert.smartElementContains(negativeCase, expectedText, field);
});

/**
* Checks, that checkbox with specified id|name|label|value is checked
* Example: Then the "PrivacyPolicy" checkbox should be checked
* Example: And the "PrivacyPolicy" checkbox should not be checked
*
* @Then /^the "([^"]*)?" checkbox should(not)* be checked$/
* 
*/
Then(/^the "([^"]*)?" checkbox should( not)* be checked$/, function (checkbox, negativeCase) {
  return browser.assert.smartCheckboxChecked(checkbox, negativeCase);
});

/**
* Checks, that checkbox with specified id|name|label|value is checked
* Example: Then the "Remember Me" checkbox is checked
* Example: And the "Remember Me" checkbox is not checked
*
* @Then /^the "([^"]*)?" checkbox is( not)* checked$/
* 
*/
Then(/^the "([^"]*)?" checkbox is( not)* checked$/, function (checkbox, negativeCase) {
  return browser.assert.smartCheckboxChecked(checkbox, negativeCase);
});

/**
* Checks, that checkbox with specified id|name|label|value is checked
* Example: Then the checkbox "PrivacyPolicy" should be checked
* Example: Then the checkbox "PrivacyPolicy" should not be checked
*
* @Then /^the "([^"]*)?" should(not)* be checked$/
* 
*/
Then(/^the checkbox "([^"]*)?" should( not)* be checked$/, function (checkbox, negativeCase) {
  return browser.assert.smartCheckboxChecked(checkbox, negativeCase);
});

/**
* Checks, that checkbox with specified id|name|label|value is checked
* Example: Then the checkbox "Remember Me" is checked
* Example: And the checkbox "Remember Me" is not checked
*
* @Then /^the checkbox "([^"]*)?" is( not)* checked$/
* 
*/
Then(/^the checkbox "([^"]*)?" is( not)* checked$/, function (checkbox, negativeCase) {
  return browser.assert.smartCheckboxChecked(checkbox, negativeCase);
});