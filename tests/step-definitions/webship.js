const {  Given} = require('@cucumber/cucumber');
const {  When,  Before} = require('@cucumber/cucumber');
const {  Then} = require('@cucumber/cucumber');

const request = require('request');

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
  return browser.click('[value="' + element + '"]');
});

/**
 * Clicks link with specified element
 * Example: When I click "Contact Us"
 * Example: And I click "aboutUs"
 *
 */
When(/^(I|we)* click "([^"]*)?"$/, function (pronoundCase, item) {
  return browser.click(item);
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
  browser.setValue(field, value);
});

/**
 * Fills in form field with specified element
 * Example: When I fill in "username" with:
 *
 */
When(/^(I|we)* fill in "([^"]*)?" with:$/, function (pronoundCase, field) {
  browser.setValue(field, '');
});

/**
 * Fills in form field with specified element
 * Example: And I fill in "webshipco" for "username"
 *
 */
When(/^(I|we)* fill in "([^"]*)?" for "([^"]*)?"$/, function (pronoundCase, value, field) {
  browser.setValue(field, value);
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
 */
When(/^(I|we)* fill in the following:$/, function (pronoundCase, table) {

  browser.setValue(table.rawTable[0][0], table.rawTable[0][1]);
  table.rows().forEach(row => {
    browser.setValue(row[0], row[1]);
    // browser.fillTextInput(row[0], row[1]);
  });
});

/**
 * Selects option in select field
 * Example: When I select "mercedes" from "Cars"
 *
 */
When(/^(I|we)* select "([^"]*)?" from "([^"]*)?"$/, function (pronoundCase, option, dropdownlist) {

  return browser.click('select' + dropdownlist + ' option[value=' + option + ']');
});

/**
 * Checks checkbox specified
 * Example: When I check "Remember me"
 *
 */
When(/^(I|we)* check "([^"]*)?"$/, function (pronoundCase, item) {
  browser.isSelected(item, function (result) {
      if (!result.value) {
        this.click(item);
      }
    });
});

/**
 * Unchecks checkbox specified
 * Example: When I uncheck "Remember me"
 *
 */
When(/^(I|we)* uncheck "([^"]*)?"$/, function (pronoundCase, item) {
  browser.isSelected(item, function (result) {
      if (result.value) {
        this.click(item); 
      }
    });
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should be on homepage
 *
 */
Then(/^(I|we)* should be on homepage$/, function (pronoundCase) {
  return browser.assert.urlEquals(browser.launch_url + "/");
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should be on the homepage
 *
 */
Then(/^(I|we)* should be on the homepage$/, function (pronoundCase) {
  return browser.assert.urlEquals(browser.launch_url + "/");
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should not be on homepage
 *
 */
Then(/^(I|we)* should not be on homepage$/, function (pronoundCase) {
  return browser.assert.not.urlEquals(browser.launch_url + "/");
});

/**
 * Verify, that current page is the homepage
 * Example: Then I should not be on the homepage
 *
 */
Then(/^(I|we)* should not be on the homepage$/, function (pronoundCase) {
  return browser.assert.not.urlEquals(browser.launch_url + "/");
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
 * Assert, that element contains a specific text value
 * Example: Then I should see "John Smith" in the "#username" element
 * 
 */
Then(/^(I|we)* should see "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, expectedText, element) {
  return this.shouldSee = function (browser) {
    browser.assert.textContains(element, expectedText);
  };
});

/**
 * Assert, that element contains a specific text value
 * Example: Then I should not see "Joe Smith" in the "#username" element
 *
 */
Then(/^(I|we)* should not see "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, expectedText, element) {

  return this.shouldSee = function (browser) {
    browser.assert.not.textContains(element, expectedText);
  };
});

/**
 * Assert, that element exists on current page
 * Example: Then I should see a "body" element
 *
 */
Then(/^(I|we)* should see a "([^"]*)?" element$/, function (pronoundCase, element) {
  return browser.verify.visible(element);
});

/**
 * Assert, that element exists on current page
 * Example: Then I should see an "#email" element
 *
 */
Then(/^(I|we)* should see an "([^"]*)?" element$/, function (pronoundCase, element) {
  return browser.verify.visible(element);
});

/**
 * Assert, that element not exists on current page
 * Example: Then I should not see a "#username" element
 *
 */
Then(/^(I|we)* should not see a "([^"]*)?" element$/, function (pronoundCase, element) {
  return browser.verify.not.visible(element);
});

/**
 * Assert, that element not exists on current page
 * Example: Then I should not see a "Username" element
 *
 */
Then(/^(I|we)* should not see a "([^"]*)?" element$/, function (pronoundCase, element) {
  return browser.verify.not.visible(element);
});

/**
 * Assert, that element exists on current page
 * Example: Then I should not see an "#img" element
 *
 */
Then(/^(I|we)* should not see an "([^"]*)?" element$/, function (pronoundCase, element) {
  return browser.verify.not.visible(element);
});

/**
 * Assert, that element contains a specific CSS style
 * Example: Then the "body" element should contain "color:white;"
 *
 */
Then(/^the "([^"]*)?" element should contain "([^"]*)?"$/, function (element, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  this.checkCss = function (browser) {
    browser.assert.cssProperty(element, cssProperty, propertyVal);
  };
});

/**
 * Assert, that element contains a specific CSS style
 * Example: Then the "body" element should not contain "color:white;"
 *
 */
Then(/^the "([^"]*)?" element should not contain "([^"]*)?"$/, function (element, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  this.checkCss = function (browser) {
    browser.assert.not.cssProperty(element, cssProperty, propertyVal);
  };
});

/**
 * Attaches file to field
 * Example: When I attach the file "profileIcon.jpg" to "profileIconUpload"
 *
 */
When(/^(I|we)* attach the file "([^"]*)?" to "([^"]*)?"$/, function (pronoundCase, fileUrl, element) {
  // browser.setValue(element, require('path').resolve(__dirname + fileUrl));
});

/**
 * Assert, that field contain a specific text
 * Example: Then the "#username" field should contain "John Smith"
 *
 */
Then(/^the "([^"]*)?" field should contain "([^"]*)?"$/, function (field, expectedText) {

  return this.shouldSee = function (browser) {
    browser.assert.textContains(field, expectedText);
  };
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
 * Checks, that the current page response status is equal the specified code
 * Example: Then the response status code should be 200
 *
 */
Then(/^the response status code should be (\d+)$/, function (expectedStatusCode) {
  return browser.url(function (currentURL) {
    request(currentURL.value, (error, response, body) => {
      browser.assert.equal(response.statusCode, expectedStatusCode);
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
    request(currentURL.value, (error, response, body) => {
      browser.assert.not.equal(response.statusCode, expectedStatusCode);
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
  // return browser.elements('css selector', element, function (elements) {
  // elements.value.forEach(function (elementsObj) {
  return this.shouldSeePattern = function (browser) {
    browser.assert.textMatches(element, textPattern);
  };
  //   });
  // });
});

/**
 * Checks, that page contains text matching specified pattern
 * Example: Then I should not see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element 
 * //pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 */
Then(/^(I|we)* should not see text matching "([^"]*)?" in the "([^"]*)?" element$/, function (pronoundCase, textPattern, element) {

  // return browser.elements('css selector', element, function (elements) {
  //   elements.value.forEach(function (elementsObj) {
  return this.shouldSeePattern = function (browser) {
    browser.assert.not.textMatches(element, textPattern);
  };
  // browser.assert.not.textMatches(elementsObj, textPattern);
  //   });
  // });
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