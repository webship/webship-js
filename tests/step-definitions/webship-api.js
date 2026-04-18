const { Given, When, Then, Before } = require('@cucumber/cucumber');
const axios = require('axios');
const assert = require('assert');

// Global variables to store API response and request data
let apiResponse = null;
let apiRequestData = null;
let apiHeaders = {};
let baseURL = '';
let authorization = '';
let placeHolders = {};

Before(async function () {
  // Reset API state before each scenario
  apiResponse = null;
  apiRequestData = null;
  apiHeaders = {};
  authorization = '';
  placeHolders = {};
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
 * Adds Basic Authentication header to the next request.
 *
 * Example #1: Given I am authenticating as "admin" with "password123" password
 * Example #2: Given We are authenticating as "user@example.com" with "secret" password
 * Example #3: Given I am authenticating as "api-user" with "pass!word" password
 * Example #4: Given we are authenticating as "reader" with "readonly" password
 *
 */
Given(/^(?:I am|we are) authenticating as "([^"]*)" with "([^"]*)" password$/, function (username, password) {
  delete apiHeaders['Authorization'];
  authorization = Buffer.from(username + ':' + password).toString('base64');
  apiHeaders['Authorization'] = 'Basic ' + authorization;
});

/**
 * Sets a single HTTP request header.
 *
 * Example #1: Given I set header "Content-Type" with value "application/json"
 * Example #2: Given I set header "Authorization" with value "Bearer token123"
 * Example #3: Given I set header "Accept" with value "application/xml"
 * Example #4: Given I set header "Accept" with value "application/json"
 * Example #5: Given we set header "X-Api-Key" with value "abcd-1234"
 * Example #6: Given I set header "User-Agent" with value "webship-js"
 * Example #7: Given we set header "Accept-Language" with value "en-US"
 * Example #8: Given I set header "If-None-Match" with value "etag-xyz"
 *
 */
Given(/^(?:I |we )?set header "([^"]*)" with value "([^"]*)"$/, function (name, value) {
  apiHeaders[name] = replacePlaceHolder(value);
});

/**
 * Set the base URL for API calls. Accepts full URLs or paths relative to LAUNCH_URL.
 *
 * Example #1: Given the API base URL is "https://jsonplaceholder.typicode.com"
 * Example #2: Given I set the API base URL to "https://api.example.com/v1"
 * Example #3: Given the base URL is "http://localhost:3000/api"
 * Example #4: Given the API base URL is "https://un.org/api"
 * Example #5: Given I set the API base URL to "/api/v2"
 * Example #6: Given the base URL is "/webship.co/api"
 * Example #7: Given the API base URL is "http://127.0.0.1:8080"
 *
 */
Given(/^(?:the API base URL is|I set the API base URL to|the base URL is) "([^"]*)"$/, function (url) {
  // Check if the input is a full URL (contains protocol)
  if (url.match(/^https?:\/\//)) {
    baseURL = url.replace(/\/$/, ''); // Remove trailing slash
  } else {
    // If not a full URL, combine with the LAUNCH_URL env variable or default
    const launchUrl = (process.env.LAUNCH_URL || 'http://localhost:8080').replace(/\/$/, '');
    baseURL = (launchUrl + '/' + url).replace(/\/+/g, '/').replace(/\/$/, '');
    baseURL = baseURL.replace(':/', '://');
  }
});

/**
 * Set a request header. Alternative syntax.
 *
 * Example #1: Given I set the header "Content-Type" to "application/json"
 * Example #2: Given I set the header "Authorization" to "Bearer token123"
 * Example #3: Given the header "Accept" is "application/json"
 * Example #4: Given we set the header "X-Api-Key" to "abcd-1234"
 * Example #5: Given I set the header "If-Match" to "etag-123"
 * Example #6: Given the header "User-Agent" is "webship-js"
 * Example #7: Given we set the header "Accept-Language" to "en-US"
 * Example #8: Given I set the header "Cache-Control" to "no-cache"
 *
 */
Given(/^(?:I set the header|we set the header|the header) "([^"]*)" (?:to|is) "([^"]*)"$/, function (headerName, headerValue) {
  apiHeaders[headerName] = replacePlaceHolder(headerValue);
});

/**
 * Set multiple headers using a table.
 *
 * Example #1: Given I set the following headers:
 *               | Content-Type  | application/json    |
 *               | Authorization | Bearer token123     |
 *               | Accept        | application/json    |
 *
 * Example #2: Given we set the following headers:
 *               | Content-Type    | application/json   |
 *               | X-Api-Key       | abcd-1234          |
 *               | Accept-Language | en-US              |
 *
 * Example #3: Given I set the following headers:
 *               | User-Agent    | webship-js         |
 *               | Cache-Control | no-cache           |
 *               | If-None-Match | etag-xyz           |
 *
 * Example #4: Given we set the following headers:
 *               | Authorization | Bearer {{token}}   |
 *               | Accept        | application/json   |
 *               | X-Request-ID  | req-001            |
 */
Given(/^(?:I|we) set the following headers:$/, function (table) {
  table.rows().forEach(row => {
    apiHeaders[row[0]] = replacePlaceHolder(row[1]);
  });
});

/**
 * Set request body data for POST/PUT requests.
 *
 * Example #1: Given I set the request body to '{"name": "John", "email": "john@example.com"}'
 * Example #2: Given the request body is '{"title": "Test Post", "body": "This is a test"}'
 * Example #3: Given we set the request body to '{"org": "Webship.co", "active": true}'
 * Example #4: Given I set the request body to '{"id": 1, "tags": ["qa","api"]}'
 * Example #5: Given the request body is '{"username": "admin", "password": "secret"}'
 * Example #6: Given we set the request body to '{"email": "hello@un.org"}'
 * Example #7: Given I set the request body to '{"status": "published"}'
 */
Given(/^(?:I set the request body to|we set the request body to|the request body is) '([^']*)'$/, function (jsonData) {
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
 * Example #1: Given I set the request body with:
 *               | name  | John Doe           |
 *               | email | john@example.com   |
 *               | age   | 30                 |
 *
 * Example #2: Given we set the request body with:
 *               | org     | Webship.co       |
 *               | country | UN               |
 *               | active  | true             |
 *
 * Example #3: Given I set the request body with:
 *               | title    | Hello World     |
 *               | body     | First post      |
 *               | userId   | 1               |
 *
 * Example #4: Given we set the request body with:
 *               | status   | published       |
 *               | priority | 5               |
 *               | featured | false           |
 */
Given(/^(?:I|we) set the request body with:$/, function (table) {
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
 * Example #2: When we send a POST request to "/posts"
 * Example #3: When I send a PUT request to "/users/1"
 * Example #4: When we send a DELETE request to "/posts/1"
 * Example #5: When I send a GET request to "/posts?userId=1"
 * Example #6: When we send a PATCH request to "/users/42"
 * Example #7: When I send a GET request to "/health"
 * Example #8: When we send a HEAD request to "/users"
 * Example #9: When I send a OPTIONS request to "/api"
 * Example #10: When we send a GET request to "/posts/{{postId}}"
 */
When(/^(?:I |we )?send a ([A-Z]+) request to "([^"]+)"$/, async function (method, endpoint) {
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
 * Example #1: When I send a POST request to "/users" with values:
 *               | name  | John Doe         |
 *               | email | john@example.com |
 *               | age   | 30               |
 *
 * Example #2: When we send a POST request to "/users" with values:
 *               | name  | Alice            |
 *               | email | alice@un.org     |
 *               | role  | editor           |
 *
 * Example #3: When I send a PUT request to "/users/1" with values:
 *               | name   | Updated Name    |
 *               | active | true            |
 *
 * Example #4: When we send a POST request to "/posts" with values:
 *               | title  | Welcome         |
 *               | body   | Hello Webship.co|
 *               | userId | 1               |
 */
When(/^(?:I |we )?send a ([A-Z]+) request to "([^"]+)" with values:$/, async function (method, endpoint, table) {
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
 * Example #1: When I send a POST request to "/users" with body:
 *               """
 *               {
 *                 "name": "John Doe",
 *                 "email": "john@example.com"
 *               }
 *               """
 *
 * Example #2: When we send a POST request to "/posts" with body:
 *               """
 *               {
 *                 "title": "Hello",
 *                 "body": "World",
 *                 "userId": 1
 *               }
 *               """
 *
 * Example #3: When I send a PUT request to "/users/1" with body:
 *               """
 *               {
 *                 "name": "Updated",
 *                 "org": "Webship.co"
 *               }
 *               """
 *
 * Example #4: When we send a POST request to "/contacts" with body:
 *               """
 *               {
 *                 "email": "info@un.org",
 *                 "subscribe": true
 *               }
 *               """
 */
When(/^(?:I |we )?send a ([A-Z]+) request to "([^"]+)" with body:$/, async function (method, endpoint, docString) {
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
 * Example #1: When I send a POST request to "/login" with form data:
 *               """
 *               username=admin
 *               password=secret
 *               remember=true
 *               """
 *
 * Example #2: When we send a POST request to "/subscribe" with form data:
 *               """
 *               email=hello@un.org
 *               list=newsletter
 *               """
 *
 * Example #3: When I send a POST request to "/contact" with form data:
 *               """
 *               name=Alice
 *               org=Webship.co
 *               message=Hello
 *               """
 *
 * Example #4: When we send a PUT request to "/profile" with form data:
 *               """
 *               name=Updated
 *               country=UN
 *               """
 */
When(/^(?:I |we )?send a ([A-Z]+) request to "([^"]+)" with form data:$/, async function (method, endpoint, docString) {
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
 * Example #3: Then the API response code should be 201
 * Example #4: Then API response code should be 204
 * Example #5: Then the API response code should be 400
 * Example #6: Then API response code should be 401
 * Example #7: Then the API response code should be 403
 * Example #8: Then API response code should be 500
 * Example #9: Then the API response code should be 301
 * Example #10: Then API response code should be 302
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
 * Example #3: Then the API response should contain "Webship.co"
 * Example #4: Then API response should contain "UN"
 * Example #5: Then the API response should contain "published"
 * Example #6: Then API response should contain "id"
 * Example #7: Then the API response should contain "email"
 * Example #8: Then API response should contain "hello@un.org"
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
 * Example #3: Then the API response should not contain "forbidden"
 * Example #4: Then API response should not contain "unauthorized"
 * Example #5: Then the API response should not contain "password"
 * Example #6: Then API response should not contain "secret"
 * Example #7: Then the API response should not contain "exception"
 * Example #8: Then API response should not contain "stack trace"
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
 * Example #1: Then the API response should contain json:
 *               """
 *               {
 *                 "name": "John Doe",
 *                 "email": "john@example.com"
 *               }
 *               """
 *
 * Example #2: Then API response should contain json:
 *               """
 *               {
 *                 "org": "Webship.co",
 *                 "active": true
 *               }
 *               """
 *
 * Example #3: Then the API response should contain json:
 *               """
 *               {
 *                 "id": 1,
 *                 "title": "Hello"
 *               }
 *               """
 *
 * Example #4: Then API response should contain json:
 *               """
 *               {
 *                 "email": "hello@un.org"
 *               }
 *               """
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
 * Alternative syntax for JSON property verification.
 *
 * Example #1: Then the JSON response should have "name" equal to "John Doe"
 * Example #2: Then the API response should have "id" equal to 1
 * Example #3: Then the JSON property "active" should be true
 * Example #4: Then the JSON response should have "org" equal to "Webship.co"
 * Example #5: Then the API response should have "email" equal to "hello@un.org"
 * Example #6: Then the JSON property "count" should be 42
 * Example #7: Then the JSON response should have "user.role" equal to "admin"
 * Example #8: Then the JSON property "published" should be false
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
 * Example #3: Then the JSON response should have property "title"
 * Example #4: Then the API response should contain property "data"
 * Example #5: Then the JSON response should have property "user.org"
 * Example #6: Then the API response should contain property "meta.total"
 * Example #7: Then the JSON response should have property "createdAt"
 * Example #8: Then the API response should contain property "links.self"
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
 * Example #3: Then the JSON response should not have property "token"
 * Example #4: Then the API response should not contain property "apiKey"
 * Example #5: Then the JSON response should not have property "user.password"
 * Example #6: Then the API response should not contain property "internal"
 * Example #7: Then the JSON response should not have property "debug"
 * Example #8: Then the API response should not contain property "stack"
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
 * Example #3: Then the response header "Content-Type" should contain "charset=utf-8"
 * Example #4: Then the header "X-Powered-By" should be "Webship.co"
 * Example #5: Then the response header "ETag" should contain "etag"
 * Example #6: Then the header "Location" should contain "/users/1"
 * Example #7: Then the response header "Access-Control-Allow-Origin" should be "*"
 * Example #8: Then the header "Content-Length" should contain "0"
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
 * Example #1: Given I set placeholder "{{userId}}" to "123"
 * Example #2: Given we set placeholder "{{token}}" to "abcd-1234"
 * Example #3: Given I set placeholder "{{postId}}" to "42"
 * Example #4: Given we set placeholder "{{org}}" to "Webship.co"
 * Example #5: Given I set placeholder "{{email}}" to "hello@un.org"
 * Example #6: Given we set placeholder "{{apiKey}}" to "secret-xyz"
 * Example #7: Given I set placeholder "{{version}}" to "v2"
 * Example #8: Given we set placeholder "{{locale}}" to "en-US"
 */
Given(/^(?:I|we) set placeholder "([^"]*)" to "([^"]*)"$/, function (placeholder, value) {
  placeHolders[placeholder] = value;
});