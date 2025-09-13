const { Given, When, Then } = require('@cucumber/cucumber');
const { Before, After, BeforeStep, AfterStep } = require('@cucumber/cucumber');
const axios = require('axios');
const assert = require('assert');

// Global variables to store API response and request data
let apiResponse = null;
let apiRequestData = null;
let apiHeaders = {};
let baseURL = '';
let authorization = '';
let placeHolders = {};

/**
 * Safely pauses based on global config for API calls.
 * @param {string} key
 */
function safePause(key) {
  const time = (global.browser?.globals?.minimum_wait_time?.[key]) || 0;
  if (time > 0) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
}

Before(async function () {
  await safePause('before_scenario');
  // Reset API state before each scenario
  apiResponse = null;
  apiRequestData = null;
  apiHeaders = {};
  authorization = '';
  placeHolders = {};
});

After(async function () {
  await safePause('after_scenario');
});

BeforeStep(async function () {
  await safePause('before_step');
});

AfterStep(async function () {
  await safePause('after_step');
});

/**
 * Helper function to replace placeholders in text
 */
function replacePlaceHolder(string) {
  for (const [key, value] of Object.entries(placeHolders)) {
    string = string.replace(new RegExp(key, 'g'), value);
  }
  return string;
}

/**
 * Helper function to prepare URL by replacing placeholders and trimming slashes
 */
function prepareUrl(url) {
  return replacePlaceHolder(url).replace(/^\/+/, '');
}

/**
 * Helper function to get nested property from object using dot notation.
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : undefined;
  }, obj);
}

/**
 * Adds Basic Authentication header to next request.
 *
 * Example #1: Given I am authenticating as "admin" with "password123" password
 * Example #2: Given I am authenticating as "user@example.com" with "secret" password
 */
Given(/^I am authenticating as "([^"]*)" with "([^"]*)" password$/, function (username, password) {
  delete apiHeaders['Authorization'];
  authorization = Buffer.from(username + ':' + password).toString('base64');
  apiHeaders['Authorization'] = 'Basic ' + authorization;
});

/**
 * Sets a HTTP Header with value.
 *
 * Example #1: Given I set header "Content-Type" with value "application/json"
 * Example #2: Given I set header "Authorization" with value "Bearer token123"
 * Example #3: Given I set header "Accept" with value "application/xml"
 */
Given(/^I set header "([^"]*)" with value "([^"]*)"$/, function (name, value) {
  apiHeaders[name] = replacePlaceHolder(value);
});

/**
 * Set the base URL for API calls (alternative syntax).
 *
 * Example #1: Given the API base URL is "https://jsonplaceholder.typicode.com"
 * Example #2: Given I set the API base URL to "https://api.example.com/v1"
 * Example #3: Given the base URL is "http://localhost:3000/api"
 */
Given(/^(?:the API base URL is|I set the API base URL to|the base URL is) "([^"]*)"$/, function (url) {
  baseURL = url.replace(/\/$/, ''); // Remove trailing slash
});

/**
 * Set request headers for API calls (alternative syntax).
 *
 * Example #1: Given I set the header "Content-Type" to "application/json"
 * Example #2: Given I set the header "Authorization" to "Bearer token123"
 * Example #3: Given the header "Accept" is "application/json"
 */
Given(/^(?:I set the header|the header) "([^"]*)" (?:to|is) "([^"]*)"$/, function (headerName, headerValue) {
  apiHeaders[headerName] = replacePlaceHolder(headerValue);
});

/**
 * Set multiple headers using a table.
 *
 * Example: Given I set the following headers:
 *            | Content-Type  | application/json    |
 *            | Authorization | Bearer token123     |
 *            | Accept        | application/json    |
 */
Given(/^I set the following headers:$/, function (table) {
  table.rows().forEach(row => {
    apiHeaders[row[0]] = replacePlaceHolder(row[1]);
  });
});

/**
 * Set request body data for POST/PUT requests.
 *
 * Example #1: Given I set the request body to '{"name": "John", "email": "john@example.com"}'
 * Example #2: Given the request body is '{"title": "Test Post", "body": "This is a test"}'
 */
Given(/^(?:I set the request body to|the request body is) '([^']*)'$/, function (jsonData) {
  try {
    const processedData = replacePlaceHolder(jsonData);
    apiRequestData = JSON.parse(processedData);
  } catch (error) {
    throw new Error(`Invalid JSON in request body: ${error.message}`);
  }
});

/**
 * Set request body using a table.
 *
 * Example: Given I set the request body with:
 *            | name  | John Doe           |
 *            | email | john@example.com   |
 *            | age   | 30                 |
 */
Given(/^I set the request body with:$/, function (table) {
  apiRequestData = {};
  table.rows().forEach(row => {
    let value = replacePlaceHolder(row[1]);
    
    // Try to parse as number or boolean, otherwise keep as string
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && !isNaN(parseFloat(value))) value = parseFloat(value);
    
    apiRequestData[row[0]] = value;
  });
});

/**
 * Sends HTTP request to specific relative URL.
 *
 * Example #1: When I send a GET request to "/users"
 * Example #2: When I send a POST request to "/posts"
 * Example #3: When I send a PUT request to "/users/1"
 * Example #4: When I send a DELETE request to "/posts/1"
 */
When(/^(?:I )?send a ([A-Z]+) request to "([^"]+)"$/, async function (method, endpoint) {
  const url = baseURL + '/' + prepareUrl(endpoint);
  
  try {
    apiResponse = await axios({
      method: method,
      url: url,
      headers: apiHeaders,
      data: apiRequestData,
      validateStatus: function (status) {
        return true; // Don't throw on any status code
      }
    });
  } catch (error) {
    throw new Error(`${method} request failed: ${error.message}`);
  }
});

/**
 * Sends HTTP request to specific URL with field values from Table.
 *
 * Example: When I send a POST request to "/users" with values:
 *            | name  | John Doe         |
 *            | email | john@example.com |
 *            | age   | 30               |
 */
When(/^(?:I )?send a ([A-Z]+) request to "([^"]+)" with values:$/, async function (method, endpoint, table) {
  const url = baseURL + '/' + prepareUrl(endpoint);
  const fields = {};
  
  const rowsHash = table.rowsHash();
  Object.keys(rowsHash).forEach(key => {
    fields[key] = replacePlaceHolder(rowsHash[key]);
  });
  
  try {
    apiResponse = await axios({
      method: method,
      url: url,
      headers: { ...apiHeaders, 'Content-Type': 'application/json' },
      data: JSON.stringify(fields),
      validateStatus: function (status) {
        return true; // Don't throw on any status code
      }
    });
  } catch (error) {
    throw new Error(`${method} request with values failed: ${error.message}`);
  }
});

/**
 * Sends HTTP request to specific URL with raw body from PyString.
 *
 * Example: When I send a POST request to "/users" with body:
 *            """
 *            {
 *              "name": "John Doe",
 *              "email": "john@example.com"
 *            }
 *            """
 */
When(/^(?:I )?send a ([A-Z]+) request to "([^"]+)" with body:$/, async function (method, endpoint, docString) {
  const url = baseURL + '/' + prepareUrl(endpoint);
  const body = replacePlaceHolder(docString.trim());

  // Parse JSON if the body looks like JSON, otherwise send as string
  let requestData = body;
  try {
    // Check if it's JSON by trying to parse it
    requestData = JSON.parse(body);
  } catch (error) {
    // If parsing fails, use the raw string
    requestData = body;
  }

  // Set appropriate Content-Type header if not already set
  const headers = { ...apiHeaders };
  if (!headers['Content-Type'] && !headers['content-type']) {
    if (typeof requestData === 'object') {
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    apiResponse = await axios({
      method: method,
      url: url,
      headers: headers,
      data: requestData,
      validateStatus: function (status) {
        return true; // Don't throw on any status code
      }
    });
  } catch (error) {
    throw new Error(`${method} request with body failed: ${error.message}`);
  }
});

/**
 * Sends HTTP request to specific URL with form data.
 *
 * Example: When I send a POST request to "/login" with form data:
 *            """
 *            username=admin
 *            password=secret
 *            remember=true
 *            """
 */
When(/^(?:I )?send a ([A-Z]+) request to "([^"]+)" with form data:$/, async function (method, endpoint, docString) {
  const url = baseURL + '/' + prepareUrl(endpoint);
  const body = replacePlaceHolder(docString.trim());
  
  // Parse form data
  const fields = {};
  body.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value !== undefined) {
      fields[key.trim()] = value.trim();
    }
  });
  
  // Convert to URL encoded format
  const formData = Object.keys(fields)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(fields[key]))
    .join('&');
  
  try {
    apiResponse = await axios({
      method: method,
      url: url,
      headers: {
        ...apiHeaders,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: formData,
      validateStatus: function (status) {
        return true; // Don't throw on any status code
      }
    });
  } catch (error) {
    throw new Error(`${method} request with form data failed: ${error.message}`);
  }
});

/**
 * Checks that API response has specific status code.
 *
 * Example #1: Then the API response code should be 200
 * Example #2: Then API response code should be 404
 */
Then(/^(?:the )?API response code should be (\d+)$/, function (expectedCode) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  const expected = parseInt(expectedCode);
  const actual = parseInt(apiResponse.status);
  assert.strictEqual(actual, expected, 
    `Expected status code ${expected}, but got ${actual}`);
});

/**
 * Checks that API response body contains specific text.
 *
 * Example #1: Then the API response should contain "success"
 * Example #2: Then API response should contain "John Doe"
 */
Then(/^(?:the )?API response should contain "([^"]*)"$/, function (expectedText) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  const responseBody = typeof apiResponse.data === 'string' ? 
    apiResponse.data : JSON.stringify(apiResponse.data);
  
  const expectedRegexp = new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  assert(expectedRegexp.test(responseBody), 
    `Response should contain "${expectedText}", but got: ${responseBody}`);
});

/**
 * Checks that API response body doesn't contain specific text.
 *
 * Example #1: Then the API response should not contain "error"
 * Example #2: Then API response should not contain "failed"
 */
Then(/^(?:the )?API response should not contain "([^"]*)"$/, function (unexpectedText) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  const responseBody = typeof apiResponse.data === 'string' ? 
    apiResponse.data : JSON.stringify(apiResponse.data);
  
  const expectedRegexp = new RegExp(unexpectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  assert(!expectedRegexp.test(responseBody), 
    `Response should not contain "${unexpectedText}", but it does. Response: ${responseBody}`);
});

/**
 * Checks that API response body contains JSON from PyString.
 *
 * Example: Then the API response should contain json:
 *            """
 *            {
 *              "name": "John Doe",
 *              "email": "john@example.com"
 *            }
 *            """
 */
Then(/^(?:the )?API response should contain json:$/, function (docString) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  let expectedJson;
  let actualJson;
  
  try {
    expectedJson = JSON.parse(replacePlaceHolder(docString.trim()));
  } catch (error) {
    throw new Error(`Cannot convert expected JSON: ${docString}`);
  }
  
  try {
    actualJson = typeof apiResponse.data === 'string' ? 
      JSON.parse(apiResponse.data) : apiResponse.data;
  } catch (error) {
    throw new Error(`Cannot convert actual response to JSON: ${apiResponse.data}`);
  }
  
  // Check that expected properties exist in actual response and match values
  Object.keys(expectedJson).forEach(key => {
    assert(actualJson.hasOwnProperty(key),
      `Expected property "${key}" not found in response. Actual response: ${JSON.stringify(actualJson, null, 2)}`);
    assert.deepStrictEqual(actualJson[key], expectedJson[key],
      `Property "${key}" mismatch. Expected: ${expectedJson[key]}, Actual: ${actualJson[key]}`);
  });
});

/**
 * Alternative syntax for JSON property verification
 */
Then(/^(?:the JSON response should have|the API response should have|the JSON property) "([^"]*)" (?:equal to|should be) (.+)$/, function (propertyPath, expectedValue) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  // Replace placeholders in expected value first
  const processedExpectedValue = replacePlaceHolder(expectedValue);

  // Parse expected value (remove quotes if string, parse numbers/booleans)
  let parsedExpectedValue = processedExpectedValue;
  if (processedExpectedValue.startsWith('"') && processedExpectedValue.endsWith('"')) {
    parsedExpectedValue = processedExpectedValue.slice(1, -1);
  } else if (processedExpectedValue === 'true') {
    parsedExpectedValue = true;
  } else if (processedExpectedValue === 'false') {
    parsedExpectedValue = false;
  } else if (!isNaN(processedExpectedValue) && !isNaN(parseFloat(processedExpectedValue))) {
    parsedExpectedValue = parseFloat(processedExpectedValue);
  }
  
  // Get the actual value from response
  const actualValue = getNestedProperty(apiResponse.data, propertyPath);
  
  assert.strictEqual(actualValue, parsedExpectedValue,
    `Expected "${propertyPath}" to be ${parsedExpectedValue}, but got ${actualValue}`);
});

/**
 * Verify a JSON property exists.
 *
 * Example #1: Then the JSON response should have property "id"
 * Example #2: Then the API response should contain property "user.email"
 */
Then(/^(?:the JSON response should have property|the API response should contain property) "([^"]*)"$/, function (propertyPath) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  const actualValue = getNestedProperty(apiResponse.data, propertyPath);
  
  assert(actualValue !== undefined, 
    `Expected property "${propertyPath}" to exist in response, but it doesn't`);
});

/**
 * Verify a JSON property does not exist.
 *
 * Example #1: Then the JSON response should not have property "password"
 * Example #2: Then the API response should not contain property "secret"
 */
Then(/^(?:the JSON response should not have property|the API response should not contain property) "([^"]*)"$/, function (propertyPath) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  const actualValue = getNestedProperty(apiResponse.data, propertyPath);
  
  assert(actualValue === undefined, 
    `Expected property "${propertyPath}" not to exist in response, but it does`);
});

/**
 * Verify the response is valid JSON.
 *
 * Example #1: Then the response should be valid JSON
 * Example #2: Then the API response should be valid JSON
 */
Then(/^(?:the response should be valid JSON|the API response should be valid JSON)$/, function () {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  assert(typeof apiResponse.data === 'object' && apiResponse.data !== null,
    'Response should be valid JSON');
});

/**
 * Verify response header value.
 *
 * Example #1: Then the response header "Content-Type" should be "application/json"
 * Example #2: Then the header "Cache-Control" should contain "no-cache"
 */
Then(/^(?:the response header|the header) "([^"]*)" should (?:be|contain) "([^"]*)"$/, function (headerName, expectedValue) {
  if (!apiResponse) {
    throw new Error('No API response available. Make sure to send a request first.');
  }
  
  const actualValue = apiResponse.headers[headerName.toLowerCase()];
  
  assert(actualValue && actualValue.includes(expectedValue),
    `Expected header "${headerName}" to contain "${expectedValue}", but got "${actualValue}"`);
});

/**
 * Prints last API response body for debugging.
 *
 * Example: Then print API response
 */
Then(/^print API response$/, function () {
  if (!apiResponse) {
    console.log('No API response available');
    return;
  }
  
  console.log(`${apiResponse.config.method.toUpperCase()} ${apiResponse.config.url} => ${apiResponse.status}:`);
  console.log(typeof apiResponse.data === 'string' ? apiResponse.data : JSON.stringify(apiResponse.data, null, 2));
});

/**
 * Sets placeholder for replacement in URLs, requests, and responses.
 *
 * Example: Given I set placeholder "{{userId}}" to "123"
 */
Given(/^I set placeholder "([^"]*)" to "([^"]*)"$/, function (placeholder, value) {
  placeHolders[placeholder] = value;
});