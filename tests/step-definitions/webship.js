const fun = require('./functions.js');

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
Then(/^I should( not)* see "([^"]*)?"$/, function (negativeCase, expectedText) {
  if (negativeCase) {
    return browser.assert.not.textContains('html', expectedText);
  }

  return browser.assert.textContains('html', expectedText);
});

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
 * Opens homepage
 * Example: When I go to the homepage
 * Example: And I go to "/"
 *
 */
When(/^ I go to( the)* homepage$/, function () {
  return browser.url(browser.launch_url);
});

/**
 * Opens specified page
 * Example: Given I am on "about-us.html"
 *
 */
Given(/^I am on "([^"]*)?"$/, function (url) {
  return browser.url(browser.launch_url + url);
});

/**
 * Opens specified page
 * Example: When I go to "contact-us.html"
 *
 */
When(/^I go to "([^"]*)?"$/, function (url) {
  return browser.url(browser.launch_url + url);
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
When(/^I press "([^"]*)?"$/, function (button) {
  return browser.click(fun.getElement(button));
});

/**
 * Reloads current page
 * Example: When I reload the page
 * Example: And I reload the page
 *
 */
 When(/^I reload( the)* page$/, function (url) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Clicks link with specified id|title|alt|text
 * Example: When I follow "Log In"
 * Example: And I follow "Log In"
 *
 * @When /^I follow "([^"]*)?"$/
 */
When(/^I follow "([^"]*)?"$/, function (link) {
  return getLinkByValue(link).click();
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: When I fill in "username" with: "bwayne"
 *
 * @When /^I fill in "([^"]*)?" with "([^"]*)?"$/
 */
When(/^I fill in "([^"]*)?" with "([^"]*)?"$/, function (field, value) {
  var els = getElement(field);
  els.value = value;
  return els;
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: When I fill in "username" with:
 *
 * @When /^I fill in "([^"]*)?" with:$/
 */
When(/^I fill in "([^"]*)?" with:$/, function (field) {
  var els = getElement(field);
  els.value = '';
  return els;
});

/**
 * Fills in form field with specified id|name|label|value
 * Example: And I fill in "bwayne" for "username"
 *
 * @When /^I fill in "([^"]*)?" for "([^"]*)?"$/
 */
When(/^I fill in "([^"]*)?" for "([^"]*)?"$/, function (value, field) {
  var els = getElement(field);
  els.value = value;
  return els;
});

/**
 * Fills in form fields with provided table
 * Example: When I fill in the "([^"]*)?"following"
 *              | username | bruceWayne |
 *              | password | iLoveBats123 |
 * Example: And I fill in the following"
 *              | username | bruceWayne |
 *              | password | iLoveBats123 |
 *
 * @When /^I fill in the following:$/
 */
When(/^I fill in the following:$/, function (table) {
  var tableEle = [];
  table.rows().forEach(row => {

    var els = getElement(row[0]);
    els.value = row[1];
    tableEle.push(els);
  });
  return tableEle;
});

/**
 * Selects option in select field with specified id|name|label|value
 * Example: When I select "Bats" from "user_fears"
 * Example: And I select "Bats" from "user_fears"
 *
 * @When /^I select "([^"]*)?" from "([^"]*)?"$/
 */
When(/^I select "([^"]*)?" from "([^"]*)?"$/, function (value, fieldDefinition) {
  var els = getElement(fieldDefinition);
  for (var i = 0; i < els.options.length; i++) {
    if (els.options[i].text === value) {
      els.selectedIndex = i;
      break;
    }
  }
  return els;
});
