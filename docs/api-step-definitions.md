
# API Step Definitions

## Overview

webship-js ships native HTTP / REST API step definitions powered by
Playwright's request fixture and `axios`. They share the browser
context's cookie jar so the same scenario can mix UI actions and
direct API calls.

## Available API Step Definitions

The documentation lists 22 distinct step definition categories:

**Authentication & Headers:**
- Given I am authenticating as "username" with "pa$$word" password
- Given I set header "Header-Name" with value "Some-Value"
- Given I set the following headers
- Given I set the header "Header-Name" to "Header-Value"

**Request Configuration:**
- Given I set placeholder "{{placeholder}}" to "value"
- Given I set the request body to 'JSON-data'
- Given I set the request body with
- Given the API base URL is "url"

**HTTP Methods:**
- When I send a METHOD request to "endpoint"
- When I send a METHOD request to "endpoint" with body
- When I send a METHOD request to "endpoint" with form data
- When I send a METHOD request to "endpoint" with values

**Response Assertions:**
- Then print API response
- Then the API response code should be {number}
- Then the API response should contain "text"
- Then the API response should contain json
- Then the API response should not contain "text"
- Then the response should be valid JSON
- Then the response header "response header" should be "value"

**JSON Response Validation:**
- Then the JSON response should have "propertyPath" equal to "value"
- Then the JSON response should have property "propertyPath"
- Then the JSON response should not have property "propertyPath"
