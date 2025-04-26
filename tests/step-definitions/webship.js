const {  Given} = require('@cucumber/cucumber');
const {  When,  Before} = require('@cucumber/cucumber');
const {  Then} = require('@cucumber/cucumber');

const axios = require('axios');

/**
 * Opens homepage.
 * Example: Given I am on homepage
 * 
 */
Given(/^(I am|we are) on homepage$/, function (pronoundCase) {
  return browser.url(browser.launch_url);
});

/**
 * Opens homepage.
 * Example: Given I am on the homepage
 * 
 */
Given(/^(I am|we are) on the homepage$/, function (pronoundCase) {
  return browser.url(browser.launch_url);
});

/**
 * Open specific page
 * Example: Given I am on "about-us.html"
 *
 */
Given(/^(I am|we are) on "([^"]*)?"$/, function (pronoundCase, url) {
  return browser.url(browser.launch_url + url);
});

/**
 * Go to homepage
 * Example: When I go to homepage
 * Example: And I go to "/"
 *
 */
When(/^(I|we)* go to homepage$/, function (pronoundCase) {
  return browser.url(browser.launch_url);
});

/**
 * Go to homepage
 * Example: When I go to the homepage
 * Example: And I go to the "/"
 *
 */
When(/^(I|we)* go to the homepage$/, function (pronoundCase) {
  return browser.url(browser.launch_url);
});

/**
 * Go to specific page
 * Example: When I go to "contact-us.html"
 *
 */
When(/^(I|we)* go to "([^"]*)?"$/, function (pronoundCase, url) {
  return browser.url(browser.launch_url + url);
});

/**
 * Asserting a text in the page.
 * 
 * Example:
 * - Then I should see "Welcome"
 * 
 */
Then(/^(I|we)* should see "([^"]*)?"$/, function (pronoundCase, expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.textContains("html", expectedText);
  };
});

/**
 * Asserting a text not in the page.
 * 
 * Example:
 * - Then I should not see "Access denied"
 * 
 */
Then(/^(I|we)* should not see "([^"]*)?"$/, function (pronoundCase, expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.not.textContains("html", expectedText);
  };
});

/**
 * Moves forward one page in browser history
 * Example: When I move forward one page
 *
 */
When(/^(I|we)* move forward one page$/, function (pronoundCase) {
  return browser.forward();
});

/**
 * Moves backward one page in browser history
 * Example: When I move backward one page
 *
 */
When(/^(I|we)* move backward one page$/, function (pronoundCase) {
  return browser.back();
});

/**
 * Presses button with specified element
 * Example: When I press "Log In"
 * Example: And I press "Log In"
 *
 */
When(/^(I|we)* press "([^"]*)?"$/, function (pronoundCase, element) {
  browser.click("[value='" + element +"']");
});

/**
 * Presses button with specified element
 * Example: When I press "btn-pressid" by attr
 * Example: When I press "btn-pressid" by attribute
 * Example: And I press "Your full name" by "placeholder" attribute
 * Example: And I press "Your full name" by its "placeholder" attribute
 * Example: And I press "save-name" by "data-drupal-selector" attr
 *
 */
When(/^(I|we)* press "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');
  var selector = '';

  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.click(selector);
});

/**
 * Clicks link with specified element
 * Example: When I click "Contact Us"
 * Example: And I click "aboutUs"
 *
 */
When(/^(I|we)* click "([^"]*)?"$/, function (pronoundCase, item) {
  return browser.click("link text", item);
});

/**
 * Click Link with specified element
 * Example: When I click "#aboutUsid" by attr
 * Example: When I click "aboutUsCss" by attribute
 * Example: And I click "aboutUsCss" by "class" attr
 * Example: And I click "aboutUsid" by its "id" attribute
 *
 */
When(/^(I|we)* click "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');
  var selector = '';

  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.click(selector);

});

/**
 * Reloads current page
 * Example: When I reload page
 * Example: And I reload page
 *
 */

When(/^(I|we)* reload page$/, function (pronoundCase) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Reloads current page
 * Example: When I reload the page
 * Example: And I reload the page
 *
 */
When(/^(I|we)* reload the page$/, function (pronoundCase) {
  return browser.refresh(browser.getCurrentUrl());
});


/**
 * Define the step of filling values in the form field specified element.
 * Example: When I fill in "Username" with "John Smith"
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with "([^"]*)?"$/, function (pronoundCase, field, value) {
  const elementField = browser.element.findByText(field);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.setValue('#' + eleAttribute.value, value);
  });
});

/**
 * Fill input type text with value by its attribute
 * Example: When I fill in "#uname" by attr
 * Example: When I fill in "uname" with "John Smith" by attr
 * Example: And I fill in "pwordcss" with "1234" by "class" attr
 * Example: And I fill in "Your full name" with "John Smith" by its "placeholder" attribute
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, attrValue, txtValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');
  var selector = '';

  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.setValue(selector, txtValue);

});

/**
 * Fill input type text with empty value by its Label
 * Example: When I fill in "Username" with:
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with:$/, function (pronoundCase, field) {
  const elementField = browser.element.findByText(field);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.setValue('#' + eleAttribute.value, '');
  });
});

/**
 * Fill input type text with empty value by its attribute
 * Example: When I fill in "#uname" with: by attr
 * Example: When I fill in "uname" with: by attr
 * Example: And I fill in "pwordcss" with: by "class" attr
 * Example: And I fill in "Your full name" with: by its "placeholder" attribute
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with: by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, attrValue , itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');
  var selector = '';

  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.setValue(selector, '');
});

/**
 * Fill in value for input type text by its Label
 * Example: When I fill in "webshipco" for "Username"
 *
 */
When(/^(I|we)* fill in "([^"]*)?" for "([^"]*)?"$/, function (pronoundCase, value, field) {
  const elementField = browser.element.findByText(field);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.setValue('#' + eleAttribute.value, value);
  });
});

/**
 * Fill in value for input type text by its attribute
 * Example: When I fill in "John Smith" for "#uname" by attr
 * Example: When I fill in "John Smith" for "uname" by attr
 * Example: And I fill in "1234" for "pwordcss" by "class" attr
 * Example: And I fill in "John Smith" for "Your full name" by its "placeholder" attribute
 *
 */
When(/^(I|we)* fill in "([^"]*)?" for "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, txtValue, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');
  var selector = '';

  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.setValue(selector, txtValue);

});

/**
 * Fills in form input fields type text with provided table by there labels 
 * Example: When I fill in the following:
 *              | Username | webshipco |
 *              | Password | 1234 |
 */

When(/^(I|we)* fill in the following:$/, function (pronoundCase, table) {

  var elementField = browser.element.findByText(table.rawTable[0][0]);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    browser.setValue('#' + eleAttribute.value, table.rawTable[0][1]);
  });
  
  table.rows().forEach(row => {

    elementField = browser.element.findByText(row[0]);
    browser.getAttribute(elementField, 'for', function (eleAttribute2) {
        browser.setValue('#' + eleAttribute2.value, row[1]);
    });
  });
});

/**
 * Fill in value for input type text by its attributeFill form fields of type input Text with the provided table according to their attributes 
 * Example: When I fill in the following: by attr
 *            | #uname | John Smith |
 *            | pwordcss | 1234 |

 * Example: When I fill in the following: by its "placeholder" attribute
 *            | Your full name | John Smith |
 *            | Your Password | 1234 |
 */

When(/^(I|we)* fill in the following: by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, itsCase, attr, attrCase, table) {

  var hasASpace = table.rawTable[0][0].indexOf(' ');
  var selector = '';
  
  if((table.rawTable[0][0].startsWith('#') || table.rawTable[0][0].startsWith('.')) && hasASpace == -1){
    selector = table.rawTable[0][0];
  }
  else if (!attr && hasASpace == -1){
    selector = table.rawTable[0][0] + ',#' + table.rawTable[0][0] + ',.' + table.rawTable[0][0] + ',[name=' + table.rawTable[0][0] + "]," + '[value="' + table.rawTable[0][0] + '"],[placeholder="' + table.rawTable[0][0] + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + table.rawTable[0][0] + '"],[placeholder="' + table.rawTable[0][0] + '"]';
  }
  else {
    selector = '[' + attr + '="' + table.rawTable[0][0] + '"]';
  }

  browser.setValue(selector, table.rawTable[0][1]);

  
  table.rows().forEach(row => {

    hasASpace = row[0].indexOf(' ');
    var selector = '';

    if((row[0].startsWith('#') || row[0].startsWith('.')) && hasASpace == -1){
      selector = row[0];
    }
    else if (!attr && hasASpace == -1){
      
      selector = row[0] + ',#' + row[0] + ',.' + row[0] + ',[name=' + row[0] + "]," + '[value="' + row[0] + '"],[placeholder="' + row[0] + '"]';
    }
    else if (!attr && hasASpace > -1){
      selector ='[value="' + row[0] + '"],[placeholder="' + row[0] + '"]';
    }
    else {
      selector = '[' + attr + '="' + row[0] + '"]';
    }

    browser.setValue(selector, row[1]);

  });
});

/**
 * Selecting the option in the dropdown list field by its text label
 * Example: When I select "Mercedes" from "Cars"
 *
 */
When(/^(I|we)* select "([^"]*)?" from "([^"]*)?"$/, function (pronoundCase, option, dropdownlist) {

  const elementField = browser.element.findByText(dropdownlist);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.waitForElementVisible('css selector', '#' + eleAttribute.value)
    .click('#' + eleAttribute.value)
    .click(browser.element.findByText(option))
    .click('#' + eleAttribute.value);
  });
});

/**
 * Selects option in select field
 * Example: When I select "Mercedes" from "cars" its "id" attr
 * Example: When I select "Saab" from "#cars" by attr
 *
 */

When(/^(I|we)* select "([^"]*)?" from "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, option, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');

  var selector = '';
  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.waitForElementVisible('css selector', selector)
    .click(selector)
    .click(browser.element.findByText(option))
    .click(selector);
});

/**
 * Checks checkbox specified
 * Example: When I check "Remember me"
 *
 */
When(/^(I|we)* check "([^"]*)?"$/, function (pronoundCase, item) {

  browser.checkItem(item);
});

/**
 * Unchecks checkbox specified
 * Example: When I uncheck "Remember me"
 *
 */
When(/^(I|we)* uncheck "([^"]*)?"$/, function (pronoundCase, item) {
  
  browser.uncheckItem(item); 
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should be on homepage
 *
 */
Then(/^(I|we)* should be on homepage$/, function (pronoundCase) {
  return browser.assert.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should be on the homepage
 *
 */
Then(/^(I|we)* should be on the homepage$/, function (pronoundCase) {
  return browser.assert.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should not be on homepage
 *
 */
Then(/^(I|we)* should not be on homepage$/, function (pronoundCase) {
  return browser.assert.not.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should not be on the homepage
 *
 */
Then(/^(I|we)* should not be on the homepage$/, function (pronoundCase) {
  return browser.assert.not.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page path is equal to specified path
 * Example: Then I should be on "/"
 * Example: And I should be on "/user/login"
 * Example: And I should be on "http://google.com"
 *
 */

Then(/^(I|we)* should be on "([^"]*)?"$/, function (pronoundCase, url) {
  return browser.assert.urlContains(url);
});

/**
 * Verify, that the current link contains the specified URL.
 * Example: Then the "Login" link should contain "/log-in"
 *
 */
Then(/^the "([^"]*)?" link should contain "([^"]*)?"$/, function (element, url) {
  const elementField = browser.element.findByText(element, { exact: true });
  return browser.assert.attributeContains(elementField, 'href', url);
});

/**
 * Verify, that the current link contains the specified URL, found by its attributes.
 * Example: Then the "#aboutUsid" link should contain "about" by attr
 * Example: And the "aboutUs" link should contain "about" by its "class" attribute
 * Example: And the ".contactUs" link should contain "/contact-" by attr
 *
 */
Then(/^the "([^"]*)?" link should contain "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (attrValue, url, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');
  var selector = '';

  if((attrValue.startsWith('#') || attrValue.startsWith('.')) && hasASpace == -1){
    selector = attrValue;
  }
  else if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"],' + '[title="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.assert.attributeContains(selector, 'href', url);
});

/**
 * Checks, that HTML response contains specific text
 * Example: Then the response should contain "Welcome visitor, How can I help you?"
 *
 */
Then(/^the response should contain "([^"]*)?"$/, function (expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.textContains("html", expectedText);
  };
});

/**
 * Checks, that HTML response contains specific text
 * Example: Then the response should not contain "Error: Ambiguous messages that are unclear"
 *
 */
Then(/^the response should not contain "([^"]*)?"$/, function (expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.not.textContains("html", expectedText);
  };
});


/**
 * Assert, that input text contains a specific value by its label
 * Example: Then I should see "John Smith" in the "Username" element
 * 
 */
Then(/^(I|we)* should see "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, expectedText, element) {
  const elementField = browser.element.findByText(element);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return this.shouldSee = function (browser) {
      browser.assert.textContains('#' + eleAttribute.value, expectedText);
    };
  });
});

/**
 * Assert, that input text contains a specific value by its attributes
 * Example: Then I should see "John Smith" in the "uname" element by its "id" attr
 * Example: Then I should see "1234" in the "pwordcss" element by attr
 * 
 */
Then(/^(I|we)* should see "([^"]*)?" in the "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, expectedText, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');

  var selector = '';
  if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return this.shouldSee = function (browser) {
    browser.assert.textContains(selector, expectedText);
  };
});

/**
 * Assert, that input text does not contain a specific value to be by its label
 * Example: Then I should not see "Joe Smith" in the "Username" element
 *
 */
Then(/^(I|we)* should not see "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, expectedText, element) {

  const elementField = browser.element.findByText(element);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return this.shouldSee = function (browser) {
      browser.assert.not.textContains('#' + eleAttribute.value, expectedText);
    };
  });
});

/**
 * Assert, that input text contains a specific value by its attributes
 * Example: Then I should not see "John Smith" in the "uname" element by its "id" attr
 * Example: Then I should not see "1234" in the "pwordcss" element by attr
 * 
 */
Then(/^(I|we)* should not see "([^"]*)?" in the "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, expectedText, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');

  var selector = '';
  if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return this.shouldSee = function (browser) {
    browser.assert.not.textContains(selector, expectedText);
  };
});

/**
 * Assert, that element exists on current page by its label
 * Example: Then I should see a "Username" element
 *
 */
Then(/^(I|we)* should see (a|an) "([^"]*)?" element$/, function (pronoundCase, aAnCase, element) {
  const elementField = browser.element.findByText(element, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.verify.visible('#' + eleAttribute.value);
  });
});

/**
 * Assert, that element exists on the current page by its attribute
 * Example: Then I should see a "uname" element by its "id" attr
 * Example: Then I should see a "pwordcss" element by attr
 * 
 */
Then(/^(I|we)* should see (a|an) "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, aAnCase, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');

  var selector = '';
  if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

    return browser.verify.visible(selector);
});

/**
 * Assert, that element exists on current page by its label
 * Example: Then I should not see a "Username" element
 *
 */
Then(/^(I|we)* should not see (a|an) "([^"]*)?" element$/, function (pronoundCase, aAnCase, element) {

  browser.assert.not.textContains("html", element);
});

/**
 * Assert, that element exists on current page by its attributes
 * Example: Then I should not see an "emailId" element by its "id" attr
 * Example: And I should not see a "countryCss" element by attr
 *
 */
Then(/^(I|we)* should not see (a|an) "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronoundCase, aAnCase, attrValue, itsCase, attr, attrCase) {

  const hasASpace = attrValue.indexOf(' ');

  var selector = '';
  if (!attr && hasASpace == -1){
    selector = attrValue + ',#' + attrValue + ',.' + attrValue + ',[name=' + attrValue + "]," + '[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else if (!attr && hasASpace > -1){
    selector ='[value="' + attrValue + '"],[placeholder="' + attrValue + '"]';
  }
  else {
    selector = '[' + attr + '="' + attrValue + '"]';
  }

  return browser.expect.element(selector).to.not.be.present;
});

/**
 * Assert, that element contains a specific CSS style
 * Example: Then the "body" element should contain "color:white;"
 *
 */
Then(/^the "([^"]*)?" element should contain "([^"]*)?"$/, function (selector, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  this.checkCss = function (browser) {
    browser.assert.cssProperty(selector, cssProperty, propertyVal);
  };
});

/**
 * Assert, that element contains a specific CSS style
 * Example: Then the "body" element should not contain "color:white;"
 * Example: Then the "#uname" element should not contain "border:solid 5px red;"
 * Example: Then the "pword" element should not contain "font-size: 26px;"
 */
Then(/^the "([^"]*)?" element should not contain "([^"]*)?"$/, function (selector, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  this.checkCss = function (browser) {
    browser.assert.not.cssProperty(selector, cssProperty, propertyVal);
  };
});

/**
 * Attaches file to field
 * Example: When I attach the file "profileIcon.jpg" to "#profileIconUpload"
 *
 */
When(/^(I|we)* attach the file "([^"]*)?" to "([^"]*)?"$/, function (pronoundCase, fileUrl, element) {
  var dirname = __dirname + '';
  dirname = dirname.substring(0, dirname.lastIndexOf("/"));

  return browser.setValue(element, dirname + '/assets/' + fileUrl);
});

/**
 * Assert, that field contain a specific text
 * Example: Then the "Username" field should contain "John Smith"
 *
 */
Then(/^the "([^"]*)?" field should contain "([^"]*)?"$/, function (field, expectedText) {

  const elementField = browser.element.findByText(field);
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return this.shouldSee = function (browser) {
      browser.assert.textContains('#' + eleAttribute.value, expectedText);
    };
  });
});

/**
 * Assert, that field does not contain a specific text
 * Example: Then the "#username" field should not contain "John Smith"
 *
 */
Then(/^the "([^"]*)?" field should not contain "([^"]*)?"$/, function (field, expectedText) {

  return this.shouldSee = function (browser) {
    browser.assert.not.textContains(field, expectedText);
  };
});

/**
 * Assert, that checkbox with specified element is should be checked
 * Example: Then the "#PrivacyPolicy" checkbox should be checked
 * 
 */
Then(/^the "([^"]*)?" checkbox should be checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Assert, that checkbox with specified element is should not be checked
 * Example: Then the "#PrivacyPolicy" checkbox should not be checked
 * 
 */
Then(/^the "([^"]*)?" checkbox should not be checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Check, whether the checkbox specified is checked.
 * Example: Then the "#rememberMe" checkbox is checked
 *
 */
Then(/^the "([^"]*)?" checkbox is checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Check, whether the checkbox specified is not checked.
 * Example: Then the "#rememberMe" checkbox is not checked
 *
 */
Then(/^the "([^"]*)?" checkbox is not checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Assert, that checkbox with specified element should be checked
 * Example: Then the checkbox "#PrivacyPolicy" should be checked
 *
 */
Then(/^the checkbox "([^"]*)?" should be checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Assert, that checkbox with specified element should not be checked
 * Example: Then the checkbox "#PrivacyPolicy" should not be checked
 *
 */
Then(/^the checkbox "([^"]*)?" should not be checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Assert, that checkbox with specified element is checked
 * Example: Then the checkbox "#rememberMe" is checked
 *
 */
Then(/^the checkbox "([^"]*)?" is checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Assert, that checkbox with specified element is not checked
 * Example: Then the checkbox "#rememberMe" is not checked
 *
 */
Then(/^the checkbox "([^"]*)?" is not checked$/, function (checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Wait a specific number of seconds.
 * Example: When I wait 1 second
 * Example: When I wait 5 seconds
 *
 */
When(/^(I|we)* wait (\d*) second(s)*$/, function (pronoundCase, number, withS) {
  var waitTime = number * 1000;
  return browser.pause(waitTime);
});

/**
 * Wait a max number of seconds until the element present.
 * Example: When I wait max of 6 seconds
 *
 */
When(/^(I|we)* wait max of (\d*) second(s)*$/, function (pronoundCase, number, withS) {
  var waitTime = number * 1000;
  return browser.waitForElementPresent('body', waitTime);
});

/**
 * Wait a specific number of minutes.
 * Example: When I wait 1 minute
 * Example: When I wait 5 minutes
 *
 */
When(/^(I|we)* wait (\d*) minute(s)*$/, function (pronoundCase, number, withS) {
  var waitTime = number * 1000 * 60;
  return browser.pause(waitTime);
});

/**
 * Wait a max number of minutes until the element present.
 * Example: When I wait max of 6 minutes
 *
 */
When(/^(I|we)* wait max of (\d*) minute(s)*$/, function (pronoundCase, number, withS) {
  var waitTime = number * 1000 * 60;
  return browser.waitForElementPresent('body', waitTime);
});

/**
 * Wait until the page is loaded.
 * Example: When I wait until the page is loaded
 *
 */
When(/^(I|we)* wait until the page( is)* loaded*$/, function (pronoundCase, withIs) {
  return browser.waitForElementPresent('body', 10000);
});
/**
 * Checks, that the current page response status is equal the specified code
 * Example: Then the response status code should be 200
 *
 */
Then(/^the response status code should be (\d+)$/, function (expectedStatusCode) {
  return browser.url(function (currentURL) {
    axios.get(currentURL.value)
    .then(function (response) {
      browser.assert.equal(response.status, expectedStatusCode);
    })
    .catch(function (error) {
      browser.assert.equal(error.status, expectedStatusCode);
    })
    .finally(function () {
      // always executed
    });
  });
});

/**
 * Checks, that the current page response status is not equal the specified code
 * Example: And the response status code should not be 404
 *
 */
Then(/^the response status code should not be (\d+)$/, function ( expectedStatusCode) {
  return browser.url(function (currentURL) {
    axios.get(currentURL.value)
    .then(function (response) {
      browser.assert.not.equal(response.status, expectedStatusCode);
    })
    .catch(function (error) {
      browser.assert.not.equal(error.status, expectedStatusCode);
    })
    .finally(function () {
      // always executed
    });
  });
});

/**
 * Checks, that page contains text matching specified pattern
 * Example: Then I should see text matching "^T\w+" //pattern of word start with 'T'
 *
 */
Then(/^(I|we)* should see text matching "([^"]*)?"$/, function (pronoundCase, textPattern) {
  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      return browser.assert.textMatches(elementsObj, textPattern);
    });
  });
});

/**
 * Checks, that page not contains text matching specified pattern
 * Example: Then I should not see text matching "^O\w+" //pattern of word start with 'O'
 *
 */
Then(/^(I|we)* should not see text matching "([^"]*)?"$/, function (pronoundCase, textPattern) {
  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      return browser.assert.not.textMatches(elementsObj, textPattern);
    });
  });
});

/**
 * Checks, that page contains text matching specified pattern
 * Example: Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element 
 * //pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 */
Then(/^(I|we)* should see text matching "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, textPattern, element) {
  return this.shouldSeePattern = function (browser) {
    browser.assert.textMatches(element, textPattern);
  };
});

/**
 * Checks, that page contains text matching specified pattern
 * Example: Then I should not see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element 
 * //pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 */
Then(/^(I|we)* should not see text matching "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, textPattern, element) {
  return this.shouldSeePattern = function (browser) {
    browser.assert.not.textMatches(element, textPattern);
  };
});

/**
 * Checks, that current URL Path matches regular expression
 * Example: Then the url should match "/contact-us.html"
 *
 */
Then(/^the url should match "([^"]*)?"$/, function (pattern) {
  return browser.assert.urlMatches(pattern);
});

/**
 * Checks, that current URL Path matches regular expression
 * Example: Then the url should not match "/contact-us.html"
 *
 */
Then(/^the url should not match "([^"]*)?"$/, function (pattern) {
  return browser.assert.not.urlMatches(pattern);
});