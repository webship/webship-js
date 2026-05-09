# API Testing

Webship-js scenarios can talk to an HTTP API directly without leaving the cucumber-js runtime. The browser context's cookie jar is shared, so a UI login can be followed by REST-level assertions in the same scenario.

## Setting headers and base URL

```gherkin
Given the API base URL is "https://api.example.com"
 And I set the header "Authorization" to "Bearer abc123"
 And I set the following headers:
   | X-Request-ID | test-123          |
   | Accept       | application/json  |
```

## Sending requests

```gherkin
When I send a GET request to "/users"
When I send a POST request to "/users" with body:
  """
  {"name": "Alice", "email": "alice@example.com"}
  """
When I send a PUT request to "/users/1" with form data:
  """
  name=Alice&role=admin
  """
```

## Asserting responses

```gherkin
Then the API response code should be 200
 And the API response should contain "Alice"
 And the API response should not contain "<script>"
 And the response header "content-type" should contain "json"
 And the response should be valid JSON
 And the JSON property "user.name" should be "Alice"
 And the JSON response should have property "user.id"
 And the JSON response should not have property "password"
```

## Combining UI and API

```gherkin
Scenario: Order placed via UI shows up in API
  Given I restore the auth state from "tests/auth/customer.json"
   And I am on "/cart"
  When I press "Place Order"
   And I wait until the URL contains "/orders/"
  When I send a GET request to "/api/orders?latest=1"
  Then the API response code should be 200
   And the JSON property "orders.0.status" should be "Pending"
```

## Date placeholders

API bodies often need fresh dates. Use `[relative:OFFSET#FORMAT]` tokens — they're resolved before the request is sent:

```gherkin
Given I set the request body to '{"start": "[relative:now#YYYY-MM-DD]", "end": "[relative:+7 days#YYYY-MM-DD]"}'
When I send a POST request to "/api/bookings"
Then the API response code should be 201
```

## Other request shapes

Use a data-table when the body is a flat key/value map:

```gherkin
When I send a POST request to "/users" with values:
  | name  | Alice                |
  | email | alice@example.com    |
```

Assert against an exact JSON shape with a doc string:

```gherkin
Then the API response should contain json:
  """
  {"id": 1, "name": "Alice"}
  """
```

Substitute placeholders captured from earlier responses or scenario data:

```gherkin
Given I set placeholder "{{userId}}" to "42"
When I send a GET request to "/users/{{userId}}"
```

For HTTP basic auth on the next page navigation, see also `path.steps.js`:

```gherkin
Given the basic authentication with the username "admin" and the password "secret"
```

## Short-form REST steps

A parallel short-form lives in `rest.steps.js` for quick smoke tests:

```gherkin
Given a REST header "Authorization" with value "Bearer abc123"
When I send a REST "GET" request to "/api/users"
Then the REST response status code should be 200
 And the REST response should contain "Alice"
```

## Print response (debugging only)

```gherkin
Then print API response
```

Outputs status, headers, and body to stdout. Strip before committing.
