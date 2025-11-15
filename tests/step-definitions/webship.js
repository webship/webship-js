const {  Given } = require('@cucumber/cucumber');
const {  When } = require('@cucumber/cucumber');
const {  Then } = require('@cucumber/cucumber');
const {Before, After, BeforeStep, AfterStep} = require('@cucumber/cucumber');


const axios = require('axios');
const path = require('path');


/**
 * Safely pauses based on global config.
 * Handles case where browser or globals may be undefined.
 * @param {string} key
 */
function safePause(key) {
  const time = (global.browser && global.browser.globals && global.browser.globals.minimum_wait_time && global.browser.globals.minimum_wait_time[key]) || 0;
  if (time > 0 && global.browser && global.browser.pause) {
    global.browser.pause(time);
  }
}

Before(function () {
  safePause('before_scenario');
});

After(function () {
  safePause('after_scenario');
});

BeforeStep(function () {
  safePause('before_step');
});

AfterStep(function () {
  safePause('after_step');
});

/**
 * Opens homepage.
 *
 * Example #1: Given I am on homepage
 * Example #2: Given I am on the homepage
 * Example #2: Given I am on frontpage
 * Example #3: Given I am on the frontpage
 * Example #4: Given we are on homepage
 * Example #5: Given on the homepage
 * Example #6: Given on homepage
 * Example #7: Given we are on the frontpage
 * Example #8: Given on frontpage
 *
 *
 */
Given(/^(I am |we are )?on( the)* (homepage|frontpage)$/, function (pronounCase, theCase, pageCase) {
  browser.url(browser.launch_url);
  let defaultTime = 3000;
  if (browser.globals && browser.globals.minimum_wait_time && browser.globals.minimum_wait_time.page) {
    defaultTime = browser.globals.minimum_wait_time.page;
  }
  browser.waitForElementPresent('body', defaultTime);
  // Wait for any dynamic content to be loaded
  return browser.executeScript('return document.readyState').then(function(result) {
    if (result !== 'complete') {
      return browser.pause(500);
    }
  });
});

/**
 * Open specific page.
 *
 * Example #1: Given I am on "/about-us.html"
 * Example #2: Given we are on "/about-us.html"
 * Example #3: Given I am on the "/about-us.html" page
 * Example #4: Given we are on the "/about-us.html" page
 * Example #5: Given on "/about-us.html"
 * Example #6: Given on the "/about-us.html" page
 *
 */
Given(/^(I am |we are )*on( the)* "([^"]*)?"( page)*$/, function (pronounCase, theCase, url, pageCase) {
  browser.url(browser.launch_url + url);

  // Wait for body element to be present using active DOM polling
  return browser.executeAsync(function(done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkBody = setInterval(function() {
      var body = document.querySelector('body');
      var readyState = document.readyState;
      attempts++;

      if (body && (readyState === 'interactive' || readyState === 'complete')) {
        clearInterval(checkBody);
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkBody);
        done({ found: false });
      }
    }, 500);
  }, [], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Page body element was not found after navigation to "' + url + '"');
    }
  });
});

/**
 * Go to homepage.
 *
 * Example #1: When I go to homepage
 * Example #2: When I go to the homepage
 * Example #3: When I navigate to the homepage
 * Example #4: When navigating to the homepage
 * Example #5: When navigating to homepage
 * Example #6: When navigating to the frontpage
 * Example #7: When we go to the homepage
 * Example #8: When we navigate to the homepage
 *
 */
When(/^(I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)$/, function (pronounCase, theCase, pageCase) {
  browser.url(browser.launch_url);
  let defaultTime = 3000;
  if (browser.globals && browser.globals.minimum_wait_time && browser.globals.minimum_wait_time.page) {
    defaultTime = browser.globals.minimum_wait_time.page;
  }
  browser.waitForElementPresent('body', defaultTime);
  // Wait for any dynamic content to be loaded
  return browser.executeScript('return document.readyState').then(function(result) {
    if (result !== 'complete') {
      return browser.pause(500);
    }
  });
});

/**
 * Go to specific page.
 *
 * Example #1: When I go to "/contact-us.html"
 * Example #2: When I go to "/user/login"
 * Example #3: When I navigate to "/admin/dashboard"
 * Example #4: When navigating to "/products"
 * Example #7: When we go to "/products"
 * Example #8: When we navigate to "/terms"
 *
 */
When(/^(I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$/, function (pronounCase, url) {
  browser.url(browser.launch_url + url);
  let defaultTime = 3000;
  if (browser.globals && browser.globals.minimum_wait_time && browser.globals.minimum_wait_time.page) {
    defaultTime = browser.globals.minimum_wait_time.page;
  }
  browser.waitForElementPresent('body', defaultTime);
  // Wait for any dynamic content to be loaded
  return browser.executeScript('return document.readyState').then(function(result) {
    if (result !== 'complete') {
      return browser.pause(500);
    }
  });
});

/**
 * Asserting a text in the page.
 *
 * Example #1: Then I should see "Welcome"
 * Example #2: Then we should see "Your accounts for the group is public"
 * Example #3: Then I should not see "Access denied"
 * Example #4: Then we should not see "Edit layout"
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?"$/, function (pronounCase, notCase, expectedText) {
  return this.shouldSee = function (browser) {
    if (notCase) {
      browser.assert.not.textContains("html", expectedText);
    } else {
      browser.assert.textContains("html", expectedText);
    }
  };
});

/**
 * Moves forward one page in browser history.
 *
 * Example: When I move forward one page
 *
 */
When(/^(I |we )*move forward one page$/, function (pronounCase) {
  return browser.forward();
});

/**
 * Moves backward one page in browser history.
 *
 * Example: When I move backward one page
 *
 */
When(/^(I |we )*move backward one page$/, function (pronounCase) {
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
When(/^(I |we )*press( the)* "([^"]*)?"( button)*$/, function (pronounCase, theCase, element, buttonCase) {
  // Actively wait for dynamically generated button by polling the DOM
  return browser.executeAsync(function(buttonText, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkButton = setInterval(function() {
      const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"], .btn, a');
      var foundButton = null;

      for (let btn of buttons) {
        const text = (btn.textContent || btn.innerText || btn.value || '').trim();
        if (text === buttonText) {
          foundButton = btn;
          break;
        }
      }

      attempts++;

      if (foundButton) {
        clearInterval(checkButton);
        // Click the button directly
        foundButton.click();
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkButton);
        done({ found: false });
      }
    }, 500);
  }, [element], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Button "' + element + '" was not found in dynamically generated content');
    }
  });
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
When(/^(I |we )*press "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue, itsCase, attr, attrCase) {

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

  // Actively wait for dynamically generated element by polling the DOM
  return browser.executeAsync(function(sel, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkElement = setInterval(function() {
      var element = document.querySelector(sel);
      attempts++;

      if (element) {
        clearInterval(checkElement);
        element.click();
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        done({ found: false });
      }
    }, 500);
  }, [selector], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Element "' + selector + '" was not found in dynamically generated content');
    }
  });
});

/**
 * Clicks link with specified element.
 *
 * Example: When I click "Contact Us"
 * Example: And I click "aboutUs"
 *
 */
When(/^(I |we )*click "([^"]*)?"$/, function (pronounCase, item) {
  // Actively wait for dynamically generated link/button by polling the DOM
  return browser.executeAsync(function(linkText, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkLink = setInterval(function() {
      var clickableElements = document.querySelectorAll('a, button, [role="button"], .btn, input[type="button"], input[type="submit"]');
      var foundElement = null;

      for (var i = 0; i < clickableElements.length; i++) {
        var text = (clickableElements[i].textContent || clickableElements[i].innerText || clickableElements[i].value || '').trim();
        if (text === linkText) {
          foundElement = clickableElements[i];
          break;
        }
      }

      attempts++;

      if (foundElement) {
        clearInterval(checkLink);
        foundElement.click();
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkLink);
        done({ found: false });
      }
    }, 500);
  }, [item], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Link/Button "' + item + '" was not found in dynamically generated content');
    }
  });
});

/**
 * Click Link with specified element.
 *
 * Example: When I click "#about-us-id" by attr
 * Example: When I click "data-selector-about" by attribute
 * Example: And I click "about-us-css" by "class" attr
 * Example: And I click "about-us-id" by its "id" attribute
 *
 */
When(/^(I |we )*click "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue, itsCase, attr, attrCase) {

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

  return browser.executeAsync(function(sel, done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkElement = setInterval(function() {
      var element = document.querySelector(sel);
      attempts++;

      if (element) {
        clearInterval(checkElement);
        element.click();
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        done({ found: false });
      }
    }, 500);
  }, [selector], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Element with selector "' + selector + '" was not found in dynamically generated content');
    }
  });

});

/**
 * Clicks on specific text within a table row that contains a specified identifier text.
 * This step finds a table, locates a row containing the identifier text, then clicks on the target text within that row.
 *
 * Example #1: When I click "Edit" in the "John Smith" row
 * Example #2: When I click "Delete" in the "Product A" row
 * Example #3: When we click "View Details" in the "Order #12345" row
 * Example #4: And I click "Download" in the "Report 2024" row
 *
 */
When(/^(I |we )*click "([^"]*)?" in( the)* "([^"]*)?" row$/, function (pronounCase, clickText, theCase, rowIdentifier) {

  return browser.executeAsync(function(rowId, targetText, done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkTable = setInterval(function() {
      // Find all tables on the page
      const tables = document.querySelectorAll('table');
      attempts++;

      if (tables.length > 0) {
        clearInterval(checkTable);

        // Search through each table for the row containing the identifier
        for (let table of tables) {
          const rows = table.querySelectorAll('tr');
          for (let row of rows) {
            const rowText = row.textContent || row.innerText;
            if (rowText.includes(rowId)) {
              // Found the correct row, now look for clickable elements with the target text

              // First, try to find exact text matches in clickable elements
              const clickableElements = row.querySelectorAll('a, button, [onclick], [role="button"], .btn, input[type="submit"], input[type="button"]');
              for (let element of clickableElements) {
                const elementText = (element.textContent || element.innerText || element.value || '').trim();
                if (elementText === targetText) {
                  element.click();
                  done({ success: true, element: element.tagName });
                  return;
                }
              }

              // If not found in obvious clickable elements, search all elements
              const allElements = row.querySelectorAll('*');
              for (let element of allElements) {
                const elementText = (element.textContent || element.innerText || '').trim();
                if (elementText === targetText) {
                  // Check if element or parent is clickable
                  let clickableParent = element;
                  while (clickableParent && clickableParent !== row) {
                    if (clickableParent.tagName === 'A' ||
                        clickableParent.tagName === 'BUTTON' ||
                        clickableParent.onclick ||
                        clickableParent.getAttribute('role') === 'button' ||
                        clickableParent.classList.contains('btn') ||
                        clickableParent.style.cursor === 'pointer') {
                      clickableParent.click();
                      done({ success: true, element: clickableParent.tagName });
                      return;
                    }
                    clickableParent = clickableParent.parentElement;
                  }

                  // If no clickable parent found, try clicking the element itself
                  try {
                    element.click();
                    done({ success: true, element: element.tagName });
                    return;
                  } catch (e) {
                    // Continue searching if click failed
                    continue;
                  }
                }
              }

              // Row found but target text not clickable
              done({
                success: false,
                error: 'Found row containing "' + rowId + '" but could not find clickable "' + targetText + '" within it. Row contains: ' + rowText.substring(0, 200) + '...'
              });
              return;
            }
          }
        }

        // Row not found
        done({
          success: false,
          error: 'Could not find row containing "' + rowId + '". Available rows: ' + Array.from(document.querySelectorAll('table tr')).map(function(r) { return (r.textContent || '').substring(0, 50); }).join(', ')
        });

      } else if (attempts >= maxAttempts) {
        clearInterval(checkTable);
        done({
          success: false,
          error: 'No tables found on the page after waiting'
        });
      }
    }, 500);
  }, [rowIdentifier, clickText], function(result) {
    if (!result || !result.value || !result.value.success) {
      var errorMsg = (result && result.value && result.value.error) || 'Could not find "' + clickText + '" in the "' + rowIdentifier + '" row. Please verify the table structure and text content.';
      browser.assert.fail(errorMsg);
    }
  });
});

/**
 * Asserts that specific text is visible or not visible within a table row that contains a specified identifier text.
 * This step finds a table, locates a row containing the identifier text, then verifies the target text is visible within that row.
 *
 * Example #1: Then I should see "Active" in the "John Smith" row
 * Example #2: Then I should see "In Stock" in the "Product A" row
 * Example #3: Then we should see "Processing" in the "Order #12345" row
 * Example #4: And I should see "Admin" in the "john.smith@example.com" row
 * Example #5: Then I should not see "Admin" in the "Jane Doe" row
 * Example #6: Then I should not see "Out of Stock" in the "Product A" row
 * Example #7: And I should not see "Inactive" in the "john.smith@example.com" row
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" row$/, function (pronounCase, notCase, expectedText, theCase, rowIdentifier) {

  return browser.execute(function(rowId, expectedTxt) {
    // Find all tables
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) {
      throw new Error('No tables found on the page');
    }

    // Search through each table for the row containing the identifier
    for (let table of tables) {
      const rows = table.querySelectorAll('tr');
      for (let row of rows) {
        const rowText = row.textContent || row.innerText;
        if (rowText.includes(rowId)) {
          // Found the correct row, now check if it contains the expected text
          if (rowText.includes(expectedTxt)) {
            return true; // Found the text
          }
        }
      }
    }
    return false; // Text not found
  }, [rowIdentifier, expectedText], function(result) {
    if (notCase) {
      if (result.value) {
        throw new Error(`Found "${expectedText}" in the "${rowIdentifier}" row, but it should not be there.`);
      }
    } else {
      if (!result.value) {
        throw new Error(`Could not find "${expectedText}" in the "${rowIdentifier}" row. Please verify the table structure and text content.`);
      }
    }
  });
});

/**
 * Reloads current page.
 *
 * Example #1: When I reload
 * Example #2:  And I reload the page
 * Example #3:  And we reload page
 * Example #4:  And we reload the page
 *
 */
When(/^(I |we )*reload( the)*( page)*$/, function (pronounCase, theCase, pageCase) {
  return browser.refresh(browser.getCurrentUrl());
});

/**
 * Define the step of filling values in the form field specified element.
 *
 * Example: When I fill in "Username" with "John Smith"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?"$/, function (pronounCase, field, value) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);
  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    // Wait for the input element to be present (handles dynamically generated form fields)
    browser.waitForElementPresent('#' + eleAttribute.value, 5000);
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
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue, txtValue, itsCase, attr, attrCase) {

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

  browser.waitForElementPresent(selector, 5000);
  return browser.setValue(selector, txtValue);

});

/**
 * Fill input type text with empty value by its Label.
 *
 * Example: When I fill in "Username" with:
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with:$/, function (pronounCase, field) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);
  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    // Wait for the input element to be present (handles dynamically generated form fields)
    browser.waitForElementPresent('#' + eleAttribute.value, 5000);
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
When(/^(I |we )*fill in "([^"]*)?" with: by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, attrValue , itsCase, attr, attrCase) {

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

  browser.waitForElementPresent(selector, 5000);
  return browser.setValue(selector, '');
});

/**
 * Fill in value for input type text by its Label.
 *
 * Example #1: When I fill in "jon-smith" for "Username"
 * Example #2: When we fill in "Testing" for "Organization options"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, function (pronounCase, value, field) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);
  const elementField = browser.element.findByText(field, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    // Wait for the input element to be present (handles dynamically generated form fields)
    browser.waitForElementPresent('#' + eleAttribute.value, 5000);
    return browser.setValue('#' + eleAttribute.value, value);
  });
});

/**
 * Fill in value for input type text by its attribute.
 *
 * Example #1: When I fill in "John Smith" for "#uname" by attr
 * Example #2: When I fill in "John Smith" for "uname" by attr
 * Example #3: And I fill in "1234" for "password" by "class" attr
 * Example #4: And I fill in "John Smith" for "Your full name" by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, txtValue, attrValue, itsCase, attr, attrCase) {

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

  // Actively wait for dynamically generated element by polling the DOM
  return browser.executeAsync(function(sel, value, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkElement = setInterval(function() {
      var element = document.querySelector(sel);
      attempts++;

      if (element) {
        clearInterval(checkElement);
        element.value = value;
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        done({ found: false });
      }
    }, 500);
  }, [selector, txtValue], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Element "' + selector + '" was not found in dynamically generated content');
    }
  });

});

/**
 * Fills in form input fields type text with provided table by there labels.
 *
 * Example: When I fill in the following:
 *              | Username | webshipco |
 *              | Password | 1234 |
 */

When(/^(I |we )*fill in( the)* following:$/, function (pronounCase, theCase, table) {

  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);

  var elementField = browser.element.findByText(table.rawTable[0][0], { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    // Wait for the input element to be present (handles dynamically generated form fields)
    browser.waitForElementPresent('#' + eleAttribute.value, 5000);
    browser.setValue('#' + eleAttribute.value, table.rawTable[0][1]);
  });

  table.rows().forEach(row => {

    elementField = browser.element.findByText(row[0], { exact: true });
    browser.getAttribute(elementField, 'for', function (eleAttribute2) {
        // Wait for the input element to be present (handles dynamically generated form fields)
        browser.waitForElementPresent('#' + eleAttribute2.value, 5000);
        browser.setValue('#' + eleAttribute2.value, row[1]);
    });
  });
});

/**
 * Fill in value for input type text by its attributeFill form fields of type
 * input Text with the provided table according to their attributes.
 *
 * Example #1: When I fill in the following: by attr
 *            | #uname | John Smith |
 *            | password | 1234 |
 *
 * Example #2: When I fill in the following: by its "placeholder" attribute
 *            | Your full name | John Smith |
 *            | Your Password | 1234 |
 */
When(/^(I |we )*fill in( the)* following: by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, theCase, itsCase, attr, attrCase, table) {

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

  browser.waitForElementPresent(selector, 5000);
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

    browser.waitForElementPresent(selector, 5000);
    browser.setValue(selector, row[1]);

  });
});

/**
 * Selecting the option in the dropdown list field by its text label.
 *
 * Example #1: When I select "Mercedes" from "Cars"
 * Example #2: When I select "saab" from "#cars"
 * Example #3: When I select "Mercedes" from "cars"
 *
 */
When(/^(I |we )*select "([^"]*)?" from "([^"]*)?"$/, function (pronounCase, option, selectList) {

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

  // Wait for select element to be present
  if (typeof selector === 'string') {
    browser.waitForElementPresent(selector, 5000);
  }
  browser.pause(300); // Allow dynamic options to render

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
 * Example #1: When I check "Remember me"
 * Example #2: When we check "Put site into maintenance mode"
 *
 */
When(/^(I |we )*check "([^"]*)?"$/, function (pronounCase, item) {
  // Actively wait for dynamically generated checkbox by polling the DOM
  return browser.executeAsync(function(checkboxItem, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkCheckbox = setInterval(function() {
      var element = null;

      // Try to find checkbox by selector (e.g., #newsletter, .checkbox)
      if (checkboxItem.startsWith('#') || checkboxItem.startsWith('.')) {
        element = document.querySelector(checkboxItem);
      } else {
        // Try to find by label text
        var labels = document.querySelectorAll('label');
        for (var i = 0; i < labels.length; i++) {
          var labelText = (labels[i].textContent || labels[i].innerText || '').trim();
          if (labelText === checkboxItem) {
            var forAttr = labels[i].getAttribute('for');
            if (forAttr) {
              element = document.getElementById(forAttr);
              break;
            }
          }
        }
      }

      attempts++;

      if (element) {
        clearInterval(checkCheckbox);
        element.checked = true;
        // Trigger change event
        var event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkCheckbox);
        done({ found: false });
      }
    }, 500);
  }, [item], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Checkbox "' + item + '" was not found in dynamically generated content');
    }
  });
});

/**
 * Unchecks checkbox specified.
 *
 * Example #1: When I uncheck "Remember me"
 * Example #2: When we uncheck "Put site into maintenance mode"
 *
 */
When(/^(I |we )*uncheck "([^"]*)?"$/, function (pronounCase, item) {
  // Actively wait for dynamically generated checkbox by polling the DOM
  return browser.executeAsync(function(checkboxItem, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkCheckbox = setInterval(function() {
      var element = null;

      // Try to find checkbox by selector (e.g., #newsletter, .checkbox)
      if (checkboxItem.startsWith('#') || checkboxItem.startsWith('.')) {
        element = document.querySelector(checkboxItem);
      } else {
        // Try to find by label text
        var labels = document.querySelectorAll('label');
        for (var i = 0; i < labels.length; i++) {
          var labelText = (labels[i].textContent || labels[i].innerText || '').trim();
          if (labelText === checkboxItem) {
            var forAttr = labels[i].getAttribute('for');
            if (forAttr) {
              element = document.getElementById(forAttr);
              break;
            }
          }
        }
      }

      attempts++;

      if (element) {
        clearInterval(checkCheckbox);
        element.checked = false;
        // Trigger change event
        var event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
        done({ found: true });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkCheckbox);
        done({ found: false });
      }
    }, 500);
  }, [item], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Checkbox "' + item + '" was not found in dynamically generated content');
    }
  });
});

/**
 * Verify, that current page is or is not the homepage.
 *
 * Example #1: Then I should be on homepage
 * Example #2:  And I should be on the homepage
 * Example #3: Then I should be on frontpage
 * Example #4:  And should be on the homepage
 * Example #5: Then should be on homepage
 * Example #6:  And we should be on homepage
 * Example #7: Then should be on frontpage
 * Example #8:  And we should be on the homepage
 * Example #9: Then I should not be on homepage
 * Example #10: And I should not be on the homepage
 * Example #11: Then I should not be on frontpage
 * Example #12: Then we should not be on homepage
 * Example #13: Then should not be on the homepage
 * Example #14: And we should not be on frontpage
 * Example #15: And we should not be on the homepage
 *
 */
Then(/^(I |we )*should( not)* be on( the)* (homepage|frontpage)$/, function (pronounCase, notCase, theCase, pageCase) {
  if (notCase) {
    return browser.assert.not.urlMatches(browser.launch_url);
  } else {
    return browser.assert.urlMatches(browser.launch_url);
  }
});

/**
 * Verify, that current page path is equal or not equal to specified path.
 *
 * Example #1: Then I should be on "/"
 * Example #2:  And I should be on "/user/login"
 * Example #3:  And I should be on "https://un.org"
 * Example #4: Then we should be on the "/" page
 * Example #5:  And we should be on "/user/login"
 * Example #6:  And we should be on "https://google.com"
 * Example #7: Then should be on the "/user/reset" page
 * Example #8:  And we should be on "https://x.com"
 * Example #9: Then I should not be on "/"
 * Example #10: And I should not be on "/user/login"
 * Example #11: And I should not be on "https://un.org"
 * Example #12: Then we should not be on the "/" page
 * Example #13: And we should not be on "/user/login"
 * Example #14: Then we should not be on "https://google.com"
 * Example #15: And should not be on "/user/reset"
 * Example #16: And we should not be on the "https://x.com" page
 *
 */
Then(/^(I |we )*should( not)* be on( the)* "([^"]*)?"( page)*$/, function (pronounCase, notCase, theCase, url, pageCase) {
  if (notCase) {
    return browser.assert.not.urlContains(url);
  } else {
    return browser.assert.urlContains(url);
  }
});

/**
 * Verify, that the current link contains the specified URL.
 *
 * Example: Then the "Login" link should contain "/log-in"
 *
 */
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?"$/, function (theCase, element, url) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);
  const elementField = browser.element.findByText(element, { exact: true });
  // Wait for link to be present (handles dynamically generated links)
  browser.waitForElementPresent(elementField, 5000);
  return browser.assert.attributeContains(elementField, 'href', url);
});

/**
 * Verify, that the current link contains the specified URL, found by its attributes.
 *
 * Example #1: Then the "#about-us-id" link should contain "about" by attr
 * Example #2: And the "aboutUs" link should contain "about" by its "class" attribute
 * Example #3: And the ".contactUs" link should contain "/contact-" by attr
 *
 */
Then(/^(the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)$/, function (theCase, attrValue, url, itsCase, attr, attrCase) {

  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);

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

  // Wait for link to be present (handles dynamically generated links)
  browser.waitForElementPresent(selector, 5000);
  return browser.assert.attributeContains(selector, 'href', url);
});

/**
 * Checks, that HTML response contains or does not contain specific text.
 *
 * Example #1: Then the response should contain "Welcome visitor, How can I help you?"
 * Example #2: Then the response should not contain "Welcome visitor, How can I help you?"
 *
 */
Then(/^(the )*response should( not)* contain "([^"]*)?"$/, function (theCase, notCase, expectedText) {
  return this.shouldSee = function (browser) {
    if (notCase) {
      browser.assert.not.textContains("html", expectedText);
    } else {
      browser.assert.textContains("html", expectedText);
    }
  };
});

/**
 * Assert, that input text contains or does not contain a specific value by its label.
 *
 * Example #1: Then I should see "John Smith" in the "Username" element
 * Example #2: Then I should not see "Joe Smith" in the "Username" element
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element$/, function (pronounCase, notCase, expectedText, theCase, element) {
  // Wait for dynamic content to load
  browser.pause(500);

  const elementField = browser.element.findByText(element, { exact: true });
  browser.getAttribute(elementField, 'for', function (eleAttribute) {
    // Wait for the element to be present (handles dynamically generated elements)
    browser.waitForElementPresent('#' + eleAttribute.value, 5000);

    return this.shouldSee = function (browser) {
      // Check dynamically rendered content in the element
      browser.execute(function(selector, text) {
        const elem = document.querySelector(selector);
        if (!elem) return null;
        const content = elem.textContent || elem.innerText || elem.value || '';
        return content.includes(text);
      }, ['#' + eleAttribute.value, expectedText], function(result) {
        if (result.value === null) {
          browser.assert.fail(`Element with ID "${eleAttribute.value}" not found`);
        } else if (notCase) {
          if (result.value) {
            browser.assert.fail(`Text "${expectedText}" should not be in element`);
          }
        } else {
          if (!result.value) {
            browser.assert.fail(`Text "${expectedText}" should be in element`);
          }
        }
      });

      if (notCase) {
        browser.assert.not.textContains('#' + eleAttribute.value, expectedText);
      } else {
        browser.assert.textContains('#' + eleAttribute.value, expectedText);
      }
    };
  });
});

/**
 * Assert, that input text contains or does not contain a specific value by its attributes.
 *
 * Example #1: Then I should see "John Smith" in the "uname" element by its "id" attr
 * Example #2: Then I should see "1234" in the "pwordcss" element by attr
 * Example #3: Then I should not see "John Smith" in the "uname" element by its "id" attr
 * Example #4: Then I should not see "1234" in the "pwordcss" element by attr
 *
 */
Then(/^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, notCase, expectedText, theCase, attrValue, itsCase, attr, attrCase) {

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

  return browser.executeAsync(function(sel, text, shouldContain, done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkElement = setInterval(function() {
      var elem = document.querySelector(sel);
      attempts++;

      if (elem) {
        clearInterval(checkElement);
        var content = elem.textContent || elem.innerText || elem.value || '';
        var containsText = content.includes(text);
        done({ found: true, containsText: containsText, actualContent: content });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        done({ found: false, containsText: false, actualContent: null });
      }
    }, 500);
  }, [selector, expectedText, !notCase], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Element matching selector "' + selector + '" was not found');
    } else {
      if (notCase) {
        if (result.value.containsText) {
          browser.assert.fail('Text "' + expectedText + '" should not be in element "' + selector + '" but it is. Content: ' + result.value.actualContent);
        }
      } else {
        if (!result.value.containsText) {
          browser.assert.fail('Text "' + expectedText + '" should be in element "' + selector + '" but it is not. Content: ' + result.value.actualContent);
        }
      }
    }
  });
});

/**
 * Assert, that element exists or does not exist on current page by its label.
 *
 * Example #1: Then I should see a "Username" element
 * Example #2: Then I should not see a "Username" element
 *
 */
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element$/, function (pronounCase, notCase, aAnCase, element) {
  // Wait for elements that might be dynamically rendered
  browser.pause(500);

  if (notCase) {
    browser.assert.not.textContains("html", element);
  } else {
    // Wait for element to be rendered by JavaScript
    browser.waitForElementPresent('body', 2000);

    const elementField = browser.element.findByText(element, { exact: true });
    browser.getAttribute(elementField, 'for', function (eleAttribute) {
      // Wait for the specific element to be visible (in case it's AJAX-loaded)
      browser.waitForElementVisible('#' + eleAttribute.value, 3000);
      return browser.verify.visible('#' + eleAttribute.value);
    });
  }
});

/**
 * Assert, that element exists or does not exist on the current page by its attribute.
 *
 * Example #1: Then I should see a "uname" element by its "id" attr
 * Example #2: Then I should see a "pwordcss" element by attr
 * Example #3: Then I should not see an "emailId" element by its "id" attr
 * Example #4: And I should not see a "countryCss" element by attr
 *
 */
Then(/^(I |we )*should( not)* see (a|an) "([^"]*)?" element by( its)*( "([^"]*)?")* (attribute|attr)$/, function (pronounCase, notCase, aAnCase, attrValue, itsCase, attr, attrCase) {

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

  // Wait for dynamic content
  browser.pause(500);

  if (notCase) {
    return browser.expect.element(selector).to.not.be.present;
  } else {
    // Wait for element to be rendered and visible (for AJAX/JS content)
    browser.waitForElementVisible(selector, 3000);
    return browser.verify.visible(selector);
  }
});


/**
 * Assert, that element contains or does not contain a specific CSS style.
 *
 * Example #1: Then the "body" element should contain "color:white;"
 * Example #2: Then the "body" element should not contain "color:white;"
 * Example #3: Then the "#uname" element should not contain "border:solid 5px red;"
 * Example #4: Then the "pword" element should not contain "font-size: 26px;"
 *
 */
Then(/^(the )*"([^"]*)?" element should( not)* contain "([^"]*)?"$/, function (theCase, selector, notCase, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

  return browser.executeAsync(function(sel, cssProp, done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkElement = setInterval(function() {
      var element = document.querySelector(sel);
      attempts++;

      if (element) {
        clearInterval(checkElement);
        var computedStyle = window.getComputedStyle(element);
        var actualValue = computedStyle.getPropertyValue(cssProp);
        done({ found: true, value: actualValue });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        done({ found: false, value: null });
      }
    }, 500);
  }, [selector, cssProperty], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Element "' + selector + '" was not found');
    } else {
      var actualValue = (result.value.value || '').trim();
      var expectedValue = propertyVal.trim();

      if (notCase) {
        if (actualValue === expectedValue) {
          browser.assert.fail('Element "' + selector + '" should not contain CSS "' + cssProperty + ': ' + expectedValue + '" but it does');
        }
      } else {
        if (actualValue !== expectedValue) {
          browser.assert.fail('Element "' + selector + '" should contain CSS "' + cssProperty + ': ' + expectedValue + '" but has "' + actualValue + '"');
        }
      }
    }
  });
});

/**
 * Assert, that field contains or does not contain a specific text.
 *
 * Example #1: Then the "Username" field should contain "John Smith"
 * Example #2: Then the "#username" field should not contain "John Smith"
 *
 */
Then(/^(the )*"([^"]*)?" field should( not)* contain "([^"]*)?"$/, function (theCase, field, notCase, expectedText) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);

  if (notCase) {
    // Wait for field to be present (handles dynamically generated fields)
    browser.waitForElementPresent(field, 5000);
    return this.shouldSee = function (browser) {
      browser.assert.not.textContains(field, expectedText);
    };
  } else {
    const elementField = browser.element.findByText(field, { exact: true });
    browser.getAttribute(elementField, 'for', function (eleAttribute) {
      // Wait for the input field to be present (handles dynamically generated form fields)
      browser.waitForElementPresent('#' + eleAttribute.value, 5000);
      return this.shouldSee = function (browser) {
        browser.assert.textContains('#' + eleAttribute.value, expectedText);
      };
    });
  }
});

/**
 * Assert, that checkbox with specified element is or is not checked.
 *
 * Example #1: Then the "#PrivacyPolicy" checkbox should be checked
 * Example #2: Then the "#PrivacyPolicy" checkbox should not be checked
 *
 */
Then(/^(the )*"([^"]*)?" checkbox should( not)* be checked$/, function (theCase, checkbox, notCase) {
  // Actively wait for dynamically generated checkbox by polling the DOM
  return browser.executeAsync(function(checkboxSelector, shouldBeChecked, done) {
    var maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
    var attempts = 0;

    var checkCheckbox = setInterval(function() {
      var element = document.querySelector(checkboxSelector);
      attempts++;

      if (element) {
        clearInterval(checkCheckbox);
        var isChecked = element.checked;
        done({ found: true, checked: isChecked });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkCheckbox);
        done({ found: false, checked: false });
      }
    }, 500);
  }, [checkbox, !notCase], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Checkbox "' + checkbox + '" was not found in dynamically generated content');
    } else {
      if (notCase) {
        if (result.value.checked) {
          browser.assert.fail('Checkbox "' + checkbox + '" should not be checked but it is');
        }
      } else {
        if (!result.value.checked) {
          browser.assert.fail('Checkbox "' + checkbox + '" should be checked but it is not');
        }
      }
    }
  });
});

/**
 * Check, whether the checkbox specified is or is not checked.
 *
 * Example #1: Then the "#rememberMe" checkbox is checked
 * Example #2: Then the "#rememberMe" checkbox is not checked
 *
 */
Then(/^(the )*"([^"]*)?" checkbox is( not)* checked$/, function (theCase, checkbox, notCase) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);
  // Wait for checkbox to be present (handles dynamically generated checkboxes)
  browser.waitForElementPresent(checkbox, 5000);

  if (notCase) {
    return browser.expect.element(checkbox).to.not.be.selected;
  } else {
    return browser.expect.element(checkbox).to.be.selected;
  }
});

/**
 * Assert, that checkbox with specified element should or should not be checked.
 *
 * Example #1: Then the checkbox "#PrivacyPolicy" should be checked
 * Example #2: Then the checkbox "#PrivacyPolicy" should not be checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" should( not)* be checked$/, function (theCase, checkbox, notCase) {
  return browser.executeAsync(function(checkboxSelector, shouldBeChecked, done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkCheckbox = setInterval(function() {
      var element = document.querySelector(checkboxSelector);
      attempts++;

      if (element) {
        clearInterval(checkCheckbox);
        var isChecked = element.checked;
        done({ found: true, checked: isChecked });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkCheckbox);
        done({ found: false, checked: false });
      }
    }, 500);
  }, [checkbox, !notCase], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Checkbox "' + checkbox + '" was not found');
    } else {
      if (notCase) {
        if (result.value.checked) {
          browser.assert.fail('Checkbox "' + checkbox + '" should not be checked but it is');
        }
      } else {
        if (!result.value.checked) {
          browser.assert.fail('Checkbox "' + checkbox + '" should be checked but it is not');
        }
      }
    }
  });
});

/**
 * Assert, that checkbox with specified element is or is not checked.
 *
 * Example #1: Then the checkbox "#rememberMe" is checked
 * Example #2: Then the checkbox "#rememberMe" is not checked
 *
 */
Then(/^(the )*checkbox "([^"]*)?" is( not)* checked$/, function (theCase, checkbox, notCase) {
  return browser.executeAsync(function(checkboxSelector, shouldBeChecked, done) {
    var maxAttempts = 20;
    var attempts = 0;

    var checkCheckbox = setInterval(function() {
      var element = document.querySelector(checkboxSelector);
      attempts++;

      if (element) {
        clearInterval(checkCheckbox);
        var isChecked = element.checked;
        done({ found: true, checked: isChecked });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkCheckbox);
        done({ found: false, checked: false });
      }
    }, 500);
  }, [checkbox, !notCase], function(result) {
    if (!result || !result.value || !result.value.found) {
      browser.assert.fail('Checkbox "' + checkbox + '" was not found');
    } else {
      if (notCase) {
        if (result.value.checked) {
          browser.assert.fail('Checkbox "' + checkbox + '" should not be checked but it is');
        }
      } else {
        if (!result.value.checked) {
          browser.assert.fail('Checkbox "' + checkbox + '" should be checked but it is not');
        }
      }
    }
  });
});

/**
 * Checks, that the current page response status is or is not equal the specified code.
 *
 * Example #1: Then the response status code should be 200
 * Example #2: And the response status code should not be 404
 *
 */
Then(/^(the )*response status code should( not)* be (\d+)$/, function (theCase, notCase, expectedStatusCode) {
  return browser.url(function (currentURL) {
    axios.get(currentURL.value)
    .then(function (response) {
      if (notCase) {
        browser.assert.not.equal(response.status, expectedStatusCode);
      } else {
        browser.assert.equal(response.status, expectedStatusCode);
      }
    })
    .catch(function (error) {
      if (notCase) {
        browser.assert.not.equal(error.status, expectedStatusCode);
      } else {
        browser.assert.equal(error.status, expectedStatusCode);
      }
    })
    .finally(function () {
      // always executed
    });
  });
});

/**
 * Checks, that page contains or does not contain text matching specified pattern.
 *
 * Example #1: Then I should see text matching "^T\w+" //pattern of word start with 'T'
 * Example #2: Then I should not see text matching "^O\w+" //pattern of word start with 'O'
 *
 */
Then(/^(I |we )*should( not)* see text matching "([^"]*)?"$/, function (pronounCase, notCase, textPattern) {
  // Wait for dynamically rendered content
  browser.pause(500);
  // Wait for body element to be present (handles dynamically generated content)
  browser.waitForElementPresent('body', 5000);

  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      if (notCase) {
        return browser.assert.not.textMatches(elementsObj, textPattern);
      } else {
        return browser.assert.textMatches(elementsObj, textPattern);
      }
    });
  });
});

/**
 * Checks, that page contains or does not contain text matching specified pattern.
 *
 * Example #1: Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element
 *            // pattern of DD/MM/YYYY or DD-MM-YYYY
 * Example #2: Then I should not see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element
 *            // pattern of DD/MM/YYYY or DD-MM-YYYY
 *
 */
Then(/^(I |we )*should( not)* see text matching "([^"]*)?" in( the)* "([^"]*)?" element$/, function (pronounCase, notCase, textPattern, theCase, element) {
  // Wait for dynamic content to render (AJAX/JS)
  browser.pause(500);
  // Wait for element to be present (handles dynamically generated elements)
  browser.waitForElementPresent(element, 5000);

  if (notCase) {
    return browser.assert.not.textMatches(element, textPattern);
  } else {
    return this.shouldSeePattern = function (browser) {
      browser.assert.textMatches(element, textPattern);
    };
  }
});

/**
 * Checks, that current URL Path matches or does not match regular expression.
 *
 * Example #1: Then the url should match "/contact-us.html"
 * Example #2: Then the url should not match "/contact-us.html"
 *
 */
Then(/^(the )*url should( not)* match "([^"]*)?"$/, function (theCase, notCase, pattern) {
  // Wait for page to load and URL changes from AJAX/JS navigation
  browser.pause(500);
  // Wait for page to be present (handles dynamic navigation)
  browser.waitForElementPresent('body', 5000);

  if (notCase) {
    return browser.assert.not.urlMatches(pattern);
  } else {
    return browser.assert.urlMatches(pattern);
  }
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
  if (browser.globals && browser.globals.assets_folder) {
    assetsFolder = browser.globals.assets_folder;
  } else {
    assetsFolder = path.join(__dirname, '/tests/assets/');
  }

  const localFilePath = path.resolve(assetsFolder, fileName);

  // Wait for file input element to be present
  browser.waitForElementPresent(element, 5000);
  browser.pause(5000);
  browser.uploadFile(element, localFilePath);
  browser.pause(10000);
  return browser.setValue(element, fileName);

});



/**
 * Wait a specific number of seconds.
 *

 * Example #1: When I wait 1 second
 * Example #2: When I wait 5 seconds
 * Example #3: When we wait 3s
 * Example #4:  And wait 2s
 * Example #5:  And wait 2 seconds
 * Example #6: When we wait 1 second
 * Example #7: When we wait 5 seconds
 * Example #8: When we wait 4s
 *
 */
When(/^(I |we )*wait (\d*)( second| seconds|s)?$/, function (pronounCase, number, withSecondWord) {
  var waitTime = number * 1000;
  return browser.pause(waitTime);
});

/**
 * Wait a max number of seconds until the element present.
 *
 * Example #1: When I wait max of 1 second
 * Example #2: When I wait max of 5 seconds
 * Example #3: When we wait max of 3s
 * Example #4:  And wait max of 2s
 * Example #5:  And wait max of 2 seconds
 * Example #6: When we wait max of 1 second
 * Example #7: When we wait max of 5 seconds
 * Example #8: When we wait max of 4s
 *
 */
When(/^(I |we )*wait max of (\d*)( second| seconds|s)?$/, function (pronounCase, number, withSecondWord) {
  var waitTime = number * 1000;
  return browser.waitForElementPresent('body', waitTime);
});

/**
 * Wait a specific number of minutes.
 *
 * Example #1: When I wait 1 minute
 * Example #2: When I wait 10 minutes
 * Example #3: When we wait 1m
 * Example #4:  And wait 2s
 * Example #5:  And wait 2 minutes
 * Example #6: When we wait 1 minute
 * Example #7: When we wait 10 minutes
 * Example #8: When we wait 2m
 *
 */
When(/^(I |we )*wait (\d*)( minute| minutes|m)?$/, function (pronounCase, number, withMinuteWord) {
  var waitTime = number * 1000 * 60;
  return browser.pause(waitTime);
});

/**
 * Wait a max number of minutes until the element present.
 *
 * Example #1: When I wait 1 minute
 * Example #2: When I wait 10 minutes
 * Example #3: When we wait 1m
 * Example #4:  And wait 2s
 * Example #5:  And wait 2 minutes
 * Example #6: When we wait 1 minute
 * Example #7: When we wait 10 minutes
 * Example #8: When we wait 2m
 *
 */
When(/^(I |we )*wait max of (\d*)( minute| minutes|m)?$/, function (pronounCase, number, withMinuteWord) {
  var waitTime = number * 1000 * 60;
  return browser.waitForElementPresent('body', waitTime);
});

/**
 * Wait until the page is loaded.
 *
 * Example #1: When I wait until the page is loaded
 * Example #1: When we wait until the page is loaded
 * Example #2: When wait until page loaded
 *
 */
When(/^(I |we )*wait until( the)* page( is)* loaded*$/, function (pronounCase, theCase, withIs) {
  return browser.waitForElementPresent('body', 10000);
});



/**
 * Scrolls down the page by a custom number of pixels specified by the user.
 *
 * Example #1: And I scroll down
 * Example #2: When I scroll down 800
 * Example #3: And we scroll down 500
 * Example #4: When scrolling down 1200
 */
When(/^(I scroll|we scroll|scrolling)? down( ([^"]*)?)*$/, function(pronounCase, value) {
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
When(/^(I scroll|we scroll|scrolling)? up( ([^"]*)?)*$/, function(pronounCase, value) {
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
When(/^(I scroll|we scroll|scrolling)? to( the)* top( of the page)*$/, function(pronounCase, theCase, pageCase) {
  return browser.executeScript('document.documentElement.scrollTop = 0;');
});

/**
* Scrolls to the bottom of the current page using the full document height.
*
* Example #1: When I scroll to the bottom
* Example #2: And we scroll to bottom
* Example #3: When scrolling to the bottom of the page
*/
When(/^(I scroll|we scroll|scrolling)? to( the)* bottom( of the page)*$/, function(pronounCase, theCase, pageCase) {
  return browser.executeScript('window.scrollTo(0, document.body.scrollHeight);');
});

/**
* Scrolls to the top of a specific element identified by a CSS selector, resetting its scroll position to zero.
*
* Example #1: When I scroll to top of "#off-canvas"
* Example #2: And we scroll to top of "#sidebar"
* Example #3: When scrolling to top of "#main-container"
*/
When(/^(I scroll|we scroll|scrolling)? to top of "([^"]*)"$/, function(pronounCase, selector) {
  // Validate selector
  if (!selector || selector.trim() === '') {
      throw new Error('Selector cannot be empty. Please provide a valid CSS selector.');
  }

  // Validate selector format (basic check)
  if (selector.includes('"') || selector.includes("'")) {
      throw new Error(`Invalid selector format: "${selector}". Selector should not contain quotes.`);
  }

  try {
      // Wait for element to be present (allows dynamic elements to load)
      browser.waitForElementPresent(selector, 5000);

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
When(/^(I scroll|we scroll|scrolling)? to bottom of "([^"]*)"$/, function(pronounCase, selector) {
  // Validate selector
  if (!selector || selector.trim() === '') {
      throw new Error('Selector cannot be empty. Please provide a valid CSS selector.');
  }

  // Validate selector format (basic check)
  if (selector.includes('"') || selector.includes("'")) {
      throw new Error(`Invalid selector format: "${selector}". Selector should not contain quotes.`);
  }

  try {
      // Wait for element to be present (allows dynamic elements to load)
      browser.waitForElementPresent(selector, 5000);

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

/**
* Scrolls right the page by a custom number of pixels specified by the user.
*
* Example #1: And I scroll right
* Example #2: When I scroll right 1000
* Example #3: And we scrolling right 300
* Example #4: When scrolling right 750
*
*/
When(/^(I scroll|we scroll|scrolling)? right( ([^"]*)?)*$/, function(pronounCase, value) {
  // Parse and validate the scroll value
  let scrollValue = 350; // default value

  if (value !== null) {
    scrollValue = parseInt(String(value).trim(), 10);

    // Validate the parsed value
    if (isNaN(scrollValue)) {
      throw new Error(`Invalid scroll value: "${value}". Expected a number.`);
    }

    if (scrollValue < 0) {
      throw new Error(`Scroll right value must be positive. Received: ${scrollValue}`);
    }

    if (scrollValue > 10000) {
      console.warn(`Large scroll value detected: ${scrollValue}px. Consider if this is intentional.`);
    }
  }
  
  // Make the value negative for scrolling right
  return browser.executeScript(`window.scrollBy( ${scrollValue}, 0);`);
});

/**
 * Scrolls left the page by a custom number of pixels specified by the user.
 *
 * Example #1: And I scroll left
 * Example #2: When I scroll left 800
 * Example #3: And we scroll left 500
 * Example #4: When scrolling left 1200
 */
When(/^(I scroll|we scroll|scrolling)? left( ([^"]*)?)*$/, function(pronounCase, value) {
  // Default scroll value
  let scrollValue = 350;

  if (value !== null) {
    scrollValue = parseInt(String(value).trim(), 10);

    // Validate the parsed value
    if (isNaN(scrollValue)) {
      throw new Error(`Invalid scroll value: "${value}". Expected a number.`);
    }

    if (scrollValue < 0) {
      throw new Error(`Scroll left value must be positive. Received: ${scrollValue}`);
    }

    if (scrollValue > 10000) {
      console.warn(`Large scroll value detected: ${scrollValue}px. Consider if this is intentional.`);
    }
  }

  return browser.executeScript(`window.scrollBy( -${scrollValue},0 );`);
});

/**
* Scrolls to the very start of the current page, resetting the scroll position to zero.
*
* Example #1: When I scroll to start
* Example #2: And we scrolling to the start
* Example #3: When scrolling to the start of the page
*/
When(/^(I scroll|we scroll|scrolling)? to( the)* start( of the page)*$/, function(pronounCase, theCase, pageCase) {
  return browser.executeScript('window.scrollTo(0, window.scrollY);');
});

/**
* Scrolls to the end of the current page using the full document height.
*
* Example #1: When I scroll to the end
* Example #2: And we scroll to end
* Example #3: When scrolling to the end of the page
*/
When(/^(I scroll|we scroll|scrolling)? to( the)* end( of the page)*$/, function(pronounCase, theCase, pageCase) {
  return browser.executeScript('window.scrollTo(document.body.scrollWidth, window.scrollY);');
});

/**
* Scrolls to the start of a specific element identified by a CSS selector, resetting its scroll position to zero.
*
* Example #1: When I scroll to start of "#off-canvas"
* Example #2: And we scroll to start of "#sidebar"
* Example #3: When scrolling to start of "#main-container"
*/
When(/^(I scroll|we scroll|scrolling)? to start of "([^"]*)"$/, function(pronounCase, selector) {
  // Validate selector
  if (!selector || selector.trim() === '') {
      throw new Error('Selector cannot be empty. Please provide a valid CSS selector.');
  }

  // Validate selector format (basic check)
  if (selector.includes('"') || selector.includes("'")) {
      throw new Error(`Invalid selector format: "${selector}". Selector should not contain quotes.`);
  }

  try {
      // Wait for element to be present (allows dynamic elements to load)
      browser.waitForElementPresent(selector, 5000);

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
* Scrolls to the end of a specific element identified by a CSS selector, moving to its maximum scroll height.
*
* Example #1: When I scroll to end of "#off-canvas"
* Example #2: And we scrolling to end of "#sidebar"
* Example #3: When scrolling to end of "#main-container"
*/
When(/^(I scroll|we scroll|scrolling)? to end of "([^"]*)"$/, function(pronounCase, selector) {
  // Validate selector
  if (!selector || selector.trim() === '') {
      throw new Error('Selector cannot be empty. Please provide a valid CSS selector.');
  }

  // Validate selector format (basic check)
  if (selector.includes('"') || selector.includes("'")) {
      throw new Error(`Invalid selector format: "${selector}". Selector should not contain quotes.`);
  }

  try {
      // Wait for element to be present (allows dynamic elements to load)
      browser.waitForElementPresent(selector, 5000);

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
              element.scrollTop = element.scrollWidth;
          }
      `);

      return browser.pause(2000);
  } catch (error) {
      throw new Error(`Failed to scroll to bottom of element "${selector}": ${error.message}`);
  }
});
