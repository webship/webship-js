const {  Given } = require('@cucumber/cucumber');
const {  When } = require('@cucumber/cucumber');
const {  Then } = require('@cucumber/cucumber');

const axios = require('axios');
const path = require('path');


/**
 * Opens homepage.
 *
 * Example: Given I am on homepage
 * Example: Given I am on the homepage
 * 
 */
Given(/^(I am|we are) on( the)* homepage$/, function (pronounCase, theCase) {
  return browser.url(browser.launch_url).waitForElementPresent('body', 1000);
});

/**
 * Open specific page.
 *
 * Example: Given I am on "about-us.html"
 *
 */
Given(/^(I am|we are) on "([^"]*)?"$/, function (pronounCase, url) {
  return browser.url(browser.launch_url + url).waitForElementPresent('body', 1000);
});

/**
 * Go to homepage.
 *
 * Example: When I go to homepage
 * Example: When I go to the homepage
 *
 */
When(/^(I|we)* go to( the)* homepage$/, function (pronounCase, theCase) {
  return browser.url(browser.launch_url).waitForElementPresent('body', 1000);
});

/**
 * Go to specific page.
 *
 * Example: When I go to "contact-us.html"
 *
 */
When(/^(I|we)* go to "([^"]*)?"$/, function (pronounCase, url) {
  return browser.url(browser.launch_url + url).waitForElementPresent('body', 1000);
});

/**
 * Asserting a text in the page.
 *
 * Example:
 * - Then I should see "Welcome"
 * 
 */
Then(/^(I|we)* should see "([^"]*)?"$/, function (pronounCase, expectedText) {
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
Then(/^(I|we)* should not see "([^"]*)?"$/, function (pronounCase, expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.not.textContains("html", expectedText);
  };
});

/**
 * Moves forward one page in browser history.
 *
 * Example: When I move forward one page
 *
 */
When(/^(I|we)* move forward one page$/, function (pronounCase) {
  return browser.forward();
});

/**
 * Moves backward one page in browser history.
 *
 * Example: When I move backward one page
 *
 */
When(/^(I|we)* move backward one page$/, function (pronounCase) {
  return browser.back();
});

/**
 * Presses button with specified element.
 *
 * Example: When I press "Log In"
 * Example: And I press the "Log In" button
 * Example: And I press the "Save as" button
 *
 */
When(/^(I|we)* press( the)* "([^"]*)?"( button)*$/, function (pronounCase, theCase, element, buttonCase) {
  browser.click("[value='" + element +"']");
});

/**
 * Presses button with specified element.
 *
 * Example: When I press "btn-pressid" by attr
 * Example: When I press "btn-pressid" by attribute
 * Example: And I press "Your full name" by "placeholder" attribute
 * Example: And I press "Your full name" by its "placeholder" attribute
 * Example: And I press "save-name" by "data-selector" attr
 *
 */
When(/^(I|we)* press "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue, itsCase, attr, attrCase) {

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
 * Clicks link with specified element.
 *
 * Example: When I click "Contact Us"
 * Example: And I click "aboutUs"
 *
 */
When(/^(I|we)* click "([^"]*)?"$/, function (pronounCase, item) {
  return browser.click("link text", item);
});

/**
 * Click Link with specified element.
 *
 * Example: When I click "#aboutUsid" by attr
 * Example: When I click "aboutUsCss" by attribute
 * Example: And I click "aboutUsCss" by "class" attr
 * Example: And I click "aboutUsid" by its "id" attribute
 *
 */
When(/^(I|we)* click "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue, itsCase, attr, attrCase) {

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
 * Reloads current page.
 *
 * Example: When I reload page
 * Example: And I reload page
 *
 */

When(/^(I|we)* reload page$/, function (pronounCase) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Reloads current page.
 *
 * Example: When I reload the page
 * Example: And I reload the page
 *
 */
When(/^(I|we)* reload( the)* page$/, function (pronounCase, theCase) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Define the step of filling values in the form field specified element.
 *
 * Example: When I fill in "Username" with "John Smith"
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with "([^"]*)?"$/, function (pronounCase, field, value) {
  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.setValue('#' + eleAttribute.value, value);
  });
});

/**
 * Fill input type text with value by its attribute.
 *
 * Example: When I fill in "#uname" by attr
 * Example: When I fill in "uname" with "John Smith" by attr
 * Example: And I fill in "pwordcss" with "1234" by "class" attr
 * Example: And I fill in "Your full name" with "John Smith" by its "placeholder" attribute
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue, txtValue, itsCase, attr, attrCase) {

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
 * Fill input type text with empty value by its Label.
 *
 * Example: When I fill in "Username" with:
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with:$/, function (pronounCase, field) {
  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.setValue('#' + eleAttribute.value, '');
  });
});

/**
 * Fill input type text with empty value by its attribute.
 *
 * Example: When I fill in "#uname" with: by attr
 * Example: When I fill in "uname" with: by attr
 * Example: And I fill in "pwordcss" with: by "class" attr
 * Example: And I fill in "Your full name" with: by its "placeholder" attribute
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with: by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue , itsCase, attr, attrCase) {

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
 * Fill in value for input type text by its Label.
 *
 * Example: When I fill in "jon-smith" for "Username"
 *
 */
When(/^(I|we)* fill in "([^"]*)?" for "([^"]*)?"$/, function (pronounCase, value, field) {
  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.setValue('#' + eleAttribute.value, value);
  });
});

/**
 * Fill in value for input type text by its attribute.
 *
 * Example: When I fill in "John Smith" for "#uname" by attr
 * Example: When I fill in "John Smith" for "uname" by attr
 * Example: And I fill in "1234" for "pwordcss" by "class" attr
 * Example: And I fill in "John Smith" for "Your full name" by its "placeholder" attribute
 *
 */
When(/^(I|we)* fill in "([^"]*)?" for "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, txtValue, attrValue, itsCase, attr, attrCase) {

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
 * Fills in form input fields type text with provided table by there labels.
 *
 * Example: When I fill in the following:
 *              | Username | webshipco |
 *              | Password | 1234 |
 */

When(/^(I|we)* fill in( the)* following:$/, function (pronounCase, theCase, table) {

  var elementField = browser.element.findByText(table.rawTable[0][0], { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    browser.setValue('#' + eleAttribute.value, table.rawTable[0][1]);
  });
  
  table.rows().forEach(row => {

    elementField = browser.element.findByText(row[0], { exact: true });
    browser.getAttribute(elementField, 'for', function (eleAttribute2) {
        browser.setValue('#' + eleAttribute2.value, row[1]);
    });
  });
});

/**
 * Fill in value for input type text by its attributeFill form fields of type
 * input Text with the provided table according to their attributes.
 *
 * Example: When I fill in the following: by attr
 *            | #uname | John Smith |
 *            | pwordcss | 1234 |
 *
 * Example: When I fill in the following: by its "placeholder" attribute
 *            | Your full name | John Smith |
 *            | Your Password | 1234 |
 */
When(/^(I|we)* fill in( the)* following: by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, theCase, itsCase, attr, attrCase, table) {

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
 * Example: When I select "saab" from "#cars"
 * Example: When I select "Mercedes" from "cars"
 *
 */
When(/^(I|we)* select "([^"]*)?" from "([^"]*)?"$/, function (pronounCase, option, selectList) {

  const hasASpace = selectList.indexOf(' ');

  let selector = '';
  if((selectList.startsWith('#') || selectList.startsWith('.'))){
    selector = selectList;
  }
  else if (hasASpace == -1){
    selector = '[name="' + selectList + '"],[id="' + selectList + '"],[class="' + selectList + '"]';
  }
  else {
    selector = browser.element.findByText(selectList, { exact: true });
  }

  let optionValue = '';
  const result = option.toLowerCase();

  if(result == option){
    optionValue = '[value="' + option + '"]';
  }
  else{
    optionValue = browser.element.findByText(option, { exact: true });
  }
  
  return browser.click(selector).click(optionValue).click(selector);
});

/**
 * Checks checkbox specified.
 *
 * Example: When I check "Remember me"
 *
 */
When(/^(I|we)* check "([^"]*)?"$/, function (pronounCase, item) {
  browser.checkItem(item);
});

/**
 * Unchecks checkbox specified.
 *
 * Example: When I uncheck "Remember me"
 *
 */
When(/^(I|we)* uncheck "([^"]*)?"$/, function (pronounCase, item) {
  browser.uncheckItem(item); 
});

/**
 * Verify, that current page is the homepage.
 *
 * Example: Then I should be on homepage
 * Example: Then I should be on the homepage
 *
 */
Then(/^(I|we)* should be on( the)* homepage$/, function (pronounCase, theCase) {
  return browser.assert.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page is the homepage.
 *
 * Example: Then I should not be on homepage
 *
 */
Then(/^(I|we)* should not be on homepage$/, function (pronounCase) {
  return browser.assert.not.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page is the homepage.
 *
 * Example: Then I should not be on the homepage
 *
 */
Then(/^(I|we)* should not be on( the)* homepage$/, function (pronounCase, theCase) {
  return browser.assert.not.urlMatches(browser.launch_url);
});

/**
 * Verify, that current page path is equal to specified path.
 *
 * Example: Then I should be on "/"
 * Example: And I should be on "/user/login"
 * Example: And I should be on "http://google.com"
 *
 */
Then(/^(I|we)* should be on "([^"]*)?"$/, function (pronounCase, url) {
  return browser.assert.urlContains(url);
});

/**
 * Verify, that the current link contains the specified URL.
 *
 * Example: Then the "Login" link should contain "/log-in"
 *
 */
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?"$/, function (theCase, element, url) {
  const elementField = browser.element.findByText(element, { exact: true });
  return browser.assert.attributeContains(elementField, 'href', url);
});

/**
 * Verify, that the current link contains the specified URL, found by its attributes.
 *
 * Example: Then the "#aboutUsid" link should contain "about" by attr
 * Example: And the "aboutUs" link should contain "about" by its "class" attribute
 * Example: And the ".contactUs" link should contain "/contact-" by attr
 *
 */
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (theCase, attrValue, url, itsCase, attr, attrCase) {

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
 * Checks, that HTML response contains specific text.
 *
 * Example: Then the response should contain "Welcome visitor, How can I help you?"
 *
 */
Then(/^(the )*response should contain "([^"]*)?"$/, function (theCase, expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.textContains("html", expectedText);
  };
});

/**
 * Checks, that HTML response contains specific text.
 *
 * Example: Then the response should not contain "Error: Ambiguous messages that are unclear"
 *
 */
Then(/^(the )*response should not contain "([^"]*)?"$/, function (theCase, expectedText) {
  return this.shouldSee = function (browser) {
    browser.assert.not.textContains("html", expectedText);
  };
});


/**
 * Assert, that input text contains a specific value by its label.
 *
 * Example: Then I should see "John Smith" in the "Username" element
 * 
 */
Then(/^(I|we)* should see "([^"]*)?" in( the)* "([^"]*)?" element$/, function (pronounCase, expectedText,theCase , element) {
  const elementField = browser.element.findByText(element, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return this.shouldSee = function (browser) {
      browser.assert.textContains('#' + eleAttribute.value, expectedText);
    };
  });
});

/**
 * Assert, that input text contains a specific value by its attributes.
 *
 * Example: Then I should see "John Smith" in the "uname" element by its "id" attr
 * Example: Then I should see "1234" in the "pwordcss" element by attr
 * 
 */
Then(/^(I|we)* should see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, expectedText, theCase, attrValue, itsCase, attr, attrCase) {

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
 * Assert, that input text does not contain a specific value to be by its label.
 *
 * Example: Then I should not see "Joe Smith" in the "Username" element
 *
 */
Then(/^(I|we)* should not see "([^"]*)?" in( the)* "([^"]*)?" element$/, function (pronounCase, expectedText, theCase, element) {

  const elementField = browser.element.findByText(element, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return this.shouldSee = function (browser) {
      browser.assert.not.textContains('#' + eleAttribute.value, expectedText);
    };
  });
});

/**
 * Assert, that input text contains a specific value by its attributes.
 *
 * Example: Then I should not see "John Smith" in the "uname" element by its "id" attr
 * Example: Then I should not see "1234" in the "pwordcss" element by attr
 * 
 */
Then(/^(I|we)* should not see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, expectedText, theCase, attrValue, itsCase, attr, attrCase) {

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
 * Assert, that element exists on current page by its label.
 *
 * Example: Then I should see a "Username" element
 *
 */
Then(/^(I|we)* should see (a|an) "([^"]*)?" element$/, function (pronounCase, aAnCase, element) {
  const elementField = browser.element.findByText(element, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return browser.verify.visible('#' + eleAttribute.value);
  });
});

/**
 * Assert, that element exists on the current page by its attribute.
 *
 * Example: Then I should see a "uname" element by its "id" attr
 * Example: Then I should see a "pwordcss" element by attr
 * 
 */
Then(/^(I|we)* should see (a|an) "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, aAnCase, attrValue, itsCase, attr, attrCase) {

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
 * Assert, that element exists on current page by its label.
 *
 * Example: Then I should not see a "Username" element
 *
 */
Then(/^(I|we)* should not see (a|an) "([^"]*)?" element$/, function (pronounCase, aAnCase, element) {
  browser.assert.not.textContains("html", element);
});

/**
 * Assert, that element exists on current page by its attributes.
 *
 * Example: Then I should not see an "emailId" element by its "id" attr
 * Example: And I should not see a "countryCss" element by attr
 *
 */
Then(/^(I|we)* should not see (a|an) "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, aAnCase, attrValue, itsCase, attr, attrCase) {

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
 * Assert, that element contains a specific CSS style.
 *
 * Example: Then the "body" element should contain "color:white;"
 *
 */
Then(/^(the )*"([^"]*)?" element should contain "([^"]*)?"$/, function (theCase ,selector, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  this.checkCss = function (browser) {
    browser.assert.cssProperty(selector, cssProperty, propertyVal);
  };
});

/**
 * Assert, that element contains a specific CSS style.
 *
 * Example: Then the "body" element should not contain "color:white;"
 * Example: Then the "#uname" element should not contain "border:solid 5px red;"
 * Example: Then the "pword" element should not contain "font-size: 26px;"
 */
Then(/^(the )*"([^"]*)?" element should not contain "([^"]*)?"$/, function (theCase, selector, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  this.checkCss = function (browser) {
    browser.assert.not.cssProperty(selector, cssProperty, propertyVal);
  };
});

/**
 * Attaches file to field.
 *
 * Example: When I attach the file "profileIcon.jpg" to "#profile-icon-upload"
 *
 */
When(/^(I |we )*attach( the)* file "([^"]*)?" to "([^"]*)?"$/, function (pronounCase, theCase, fileName, element) {
  // Construct local file path.
  let assetsFolder;
  if (browser.globals.assets_folder) {
    assetsFolder = browser.globals.assets_folder;
  } else {
    assetsFolder = path.join(__dirname, '/tests/assets/');
  }

  const localFilePath = path.resolve(assetsFolder, fileName);

  browser.pause(5000);
  browser.uploadFile(element, localFilePath);
  browser.pause(10000);
  return browser.setValue(element, fileName);
  
});

/**
 * Assert, that field contain a specific text.
 *
 * Example: Then the "Username" field should contain "John Smith"
 *
 */
Then(/^(the )*"([^"]*)?" field should contain "([^"]*)?"$/, function (theCase, field, expectedText) {

  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    return this.shouldSee = function (browser) {
      browser.assert.textContains('#' + eleAttribute.value, expectedText);
    };
  });
});

/**
 * Assert, that field does not contain a specific text.
 *
 * Example: Then the "#username" field should not contain "John Smith"
 *
 */
Then(/^(the )*"([^"]*)?" field should not contain "([^"]*)?"$/, function (theCase, field, expectedText) {

  return this.shouldSee = function (browser) {
    browser.assert.not.textContains(field, expectedText);
  };
});

/**
 * Assert, that checkbox with specified element is should be checked.
 *
 * Example: Then the "#PrivacyPolicy" checkbox should be checked
 * 
 */
Then(/^(the )*"([^"]*)?" checkbox should be checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Assert, that checkbox with specified element is should not be checked.
 *
 * Example: Then the "#PrivacyPolicy" checkbox should not be checked
 * 
 */
Then(/^(the )*"([^"]*)?" checkbox should not be checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Check, whether the checkbox specified is checked.
 *
 * Example: Then the "#rememberMe" checkbox is checked
 *
 */
Then(/^(the )*"([^"]*)?" checkbox is checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Check, whether the checkbox specified is not checked.
 *
 * Example: Then the "#rememberMe" checkbox is not checked
 *
 */
Then(/^(the )*"([^"]*)?" checkbox is not checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Assert, that checkbox with specified element should be checked.
 *
 * Example: Then the checkbox "#PrivacyPolicy" should be checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" should be checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Assert, that checkbox with specified element should not be checked.
 *
 * Example: Then the checkbox "#PrivacyPolicy" should not be checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" should not be checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Assert, that checkbox with specified element is checked.
 *
 * Example: Then the checkbox "#rememberMe" is checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" is checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.be.selected;
});

/**
 * Assert, that checkbox with specified element is not checked.
 *
 * Example: Then the checkbox "#rememberMe" is not checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" is not checked$/, function (theCase, checkbox) {
  return browser.expect.element(checkbox).to.not.be.selected;
});

/**
 * Wait a specific number of seconds.
 *
 * Example: When I wait 1 second
 * Example: When I wait 5 seconds
 * Example: When I wait 3s
 *
 */
When(/^(I|we)* wait (\d*)( second)*(s)*$/, function (pronounCase, number, withWord, withS) {
  var waitTime = number * 1000;
  return browser.pause(waitTime);
});

/**
 * Wait a max number of seconds until the element present.
 *
 * Example: When I wait max of 6 seconds
 *
 */
When(/^(I|we)* wait max of (\d*)( second)*(s)*$/, function (pronounCase, number, withWord, withS) {
  var waitTime = number * 1000;
  return browser.waitForElementPresent('body', waitTime);
});

/**
 * Wait a specific number of minutes.
 *
 * Example: When I wait 1 minute
 * Example: When I wait 5 minutes
 *
 */
When(/^(I|we)* wait (\d*)( minute)*(m)*$/, function (pronounCase, number, withWord, withM) {
  var waitTime = number * 1000 * 60;
  return browser.pause(waitTime);
});

/**
 * Wait a max number of minutes until the element present.
 *
 * Example: When I wait max of 6 minutes
 *
 */
When(/^(I|we)* wait max of (\d*)( minute)*(m)*$/, function (pronounCase, number, withWord, withM) {
  var waitTime = number * 1000 * 60;
  return browser.waitForElementPresent('body', waitTime);
});

/**
 * Wait until the page is loaded.
 *
 * Example: When I wait until the page is loaded
 *
 */
When(/^(I|we)* wait until( the)* page( is)* loaded*$/, function (pronounCase, theCase, withIs) {
  return browser.waitForElementPresent('body', 10000);
});
/**
 * Checks, that the current page response status is equal the specified code.
 *
 * Example: Then the response status code should be 200
 *
 */
Then(/^(the )*response status code should be (\d+)$/, function (theCase, expectedStatusCode) {
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
 * Checks, that the current page response status is not equal the specified code.
 *
 * Example: And the response status code should not be 404
 *
 */
Then(/^(the )*response status code should not be (\d+)$/, function ( theCase, expectedStatusCode) {
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
 * Checks, that page contains text matching specified pattern.
 *
 * Example: Then I should see text matching "^T\w+" //pattern of word start with 'T'
 *
 */
Then(/^(I|we)* should see text matching "([^"]*)?"$/, function (pronounCase, textPattern) {
  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      return browser.assert.textMatches(elementsObj, textPattern);
    });
  });
});

/**
 * Checks, that page not contains text matching specified pattern.
 *
 * Example: Then I should not see text matching "^O\w+" //pattern of word start with 'O'
 *
 */
Then(/^(I|we)* should not see text matching "([^"]*)?"$/, function (pronounCase, textPattern) {
  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      return browser.assert.not.textMatches(elementsObj, textPattern);
    });
  });
});

/**
 * Checks, that page contains text matching specified pattern.
 *
 * Example: Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element 
 * //pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 */
Then(/^(I|we)* should see text matching "([^"]*)?" in( the)* "([^"]*)?" element$/, function (pronounCase, textPattern, theCase, element) {
  return this.shouldSeePattern = function (browser) {
    browser.assert.textMatches(element, textPattern);
  };
});

/**
 * Checks, that page contains text matching specified pattern.
 *
 * Example: Then I should not see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element 
 * //pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 */
Then(/^(I|we)* should not see text matching "([^"]*)?" in( the)* "([^"]*)?" element$/, function (pronounCase, textPattern, element) {
  return this.shouldSeePattern = function (browser) {
    browser.assert.not.textMatches(element, textPattern);
  };
});

/**
 * Checks, that current URL Path matches regular expression.
 *
 * Example: Then the url should match "/contact-us.html"
 *
 */
Then(/^(the )*url should match "([^"]*)?"$/, function (theCase, pattern) {
  return browser.assert.urlMatches(pattern);
});

/**
 * Checks, that current URL Path matches regular expression.
 *
 * Example: Then the url should not match "/contact-us.html"
 *
 */
Then(/^(the )*url should not match "([^"]*)?"$/, function (theCase, pattern) {
  return browser.assert.not.urlMatches(pattern);
});

/**
 * Scrolls down the page by a custom number of pixels specified by the user.
 *
 * Example #1: And I scroll down
 * Example #2: When I scroll down 800
 * Example #3: And we scroll down 500
 * Example #4: When scrolling down 1200
 */
When(/^(I|we)? (scroll|scrolling) down( ([^"]*)?)*$/, function(pronounCase, scrollAction, value) {
  // Default scroll value
  let scrollValue = 350;

  if (value !== null) {
    scrollValue = parseInt(String(value).trim(), 10);

    // Validate the parsed value
    if (isNaN(scrollValue)) {
      throw new Error(`Invalid scroll value: "${value}". Expected a number.`);
    }

    if (scrollValue < 0) {
      throw new Error(`Scroll down value must be positive. Received: ${scrollValue}`);
    }

    if (scrollValue > 10000) {
      console.warn(`Large scroll value detected: ${scrollValue}px. Consider if this is intentional.`);
    }
  }

  return browser.executeScript(`window.scrollBy(0, ${scrollValue});`);
});

/**
* Scrolls up the page by a custom number of pixels specified by the user.
*
* Example #1: And I scroll up
* Example #2: When I scroll up 1000
* Example #3: And we scrolling up 300
* Example #4: When scrolling up 750
*
*/
When(/^(I|we)? (scroll|scrolling) up( ([^"]*)?)*$/, function(pronounCase, scrollAction, value) {
  // Parse and validate the scroll value
  let scrollValue = 350; // default value

  if (value !== null) {
    scrollValue = parseInt(String(value).trim(), 10);

    // Validate the parsed value
    if (isNaN(scrollValue)) {
      throw new Error(`Invalid scroll value: "${value}". Expected a number.`);
    }

    if (scrollValue < 0) {
      throw new Error(`Scroll up value must be positive. Received: ${scrollValue}`);
    }

    if (scrollValue > 10000) {
      console.warn(`Large scroll value detected: ${scrollValue}px. Consider if this is intentional.`);
    }
  }
  
  // Make the value negative for scrolling up
  return browser.executeScript(`window.scrollBy(0, -${scrollValue});`);
});

/**
* Scrolls to the very top of the current page, resetting the scroll position to zero.
*
* Example #1: When I scroll to top
* Example #2: And we scrolling to the top
* Example #3: When scrolling to the top of the page
*/
When(/^(I|we)* (scroll|scrolling) to( the)* top( of the page)*$/, function(pronounCase, scrollAction, theCase, pageCase) {
  return browser.executeScript('document.documentElement.scrollTop = 0;');
});

/**
* Scrolls to the bottom of the current page using the full document height.
*
* Example #1: When I scroll to the bottom
* Example #2: And we scroll to bottom
* Example #3: When scrolling to the bottom of the page
*/
When(/^(I|we)* (scroll|scrolling) to( the)* bottom( of the page)*$/, function(pronounCase, scrollAction, theCase, pageCase) {
  return browser.executeScript('window.scrollTo(0, document.body.scrollHeight);');
});

/**
* Scrolls to the top of a specific element identified by a CSS selector, resetting its scroll position to zero.
*
* Example #1: When I scroll to top of "#off-canvas"
* Example #2: And we scroll to top of "#sidebar"
* Example #3: When scrolling to top of "#main-container"
*/
When(/^(I|we)* (scroll|scrolling) to top of "([^"]*)"$/, function(pronounCase, scrollAction, selector) {
  // Validate selector
  if (!selector || selector.trim() === '') {
      throw new Error('Selector cannot be empty. Please provide a valid CSS selector.');
  }
  
  // Validate selector format (basic check)
  if (selector.includes('"') || selector.includes("'")) {
      throw new Error(`Invalid selector format: "${selector}". Selector should not contain quotes.`);
  }
  
  try {
      // Check if element exists before scrolling
      const elementExists = browser.executeScript(`
          return document.querySelector("${selector}") !== null;
      `);
      
      if (!elementExists) {
          throw new Error(`Element with selector "${selector}" not found.`);
      }
      
      browser.executeScript(`
          const element = document.querySelector("${selector}");
          if (element) {
              element.scrollTop = 0;
          }
      `);
      
      return browser.pause(2000);
  } catch (error) {
      throw new Error(`Failed to scroll to top of element "${selector}": ${error.message}`);
  }
});

/**
* Scrolls to the bottom of a specific element identified by a CSS selector, moving to its maximum scroll height.
*
* Example #1: When I scroll to bottom of "#off-canvas"
* Example #2: And we scrolling to bottom of "#sidebar"
* Example #3: When scrolling to bottom of "#main-container"
*/
When(/^(I|we)* (scroll|scrolling) to bottom of "([^"]*)"$/, function(pronounCase, scrollAction, selector) {
  // Validate selector
  if (!selector || selector.trim() === '') {
      throw new Error('Selector cannot be empty. Please provide a valid CSS selector.');
  }
  
  // Validate selector format (basic check)
  if (selector.includes('"') || selector.includes("'")) {
      throw new Error(`Invalid selector format: "${selector}". Selector should not contain quotes.`);
  }
  
  try {
      // Check if element exists before scrolling
      const elementExists = browser.executeScript(`
          return document.querySelector("${selector}") !== null;
      `);
      
      if (!elementExists) {
          throw new Error(`Element with selector "${selector}" not found.`);
      }
      
      browser.executeScript(`
          const element = document.querySelector("${selector}");
          if (element) {
              element.scrollTop = element.scrollHeight;
          }
      `);
      
      return browser.pause(2000);
  } catch (error) {
      throw new Error(`Failed to scroll to bottom of element "${selector}": ${error.message}`);
  }
});