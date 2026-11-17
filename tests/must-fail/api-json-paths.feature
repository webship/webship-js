@must-fail
Feature: API JSON property checks that must fail, and what they say
  Every scenario names a property of /example-api.json wrongly or asserts a
  wrong value. tests/check-must-fail.js checks the message, the request and
  the hint.

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: A JSON Pointer to a property that is there, asserted absent
    Fails with: The JSON response has "/data/0/type", but it should not.
    Then the JSON response should not have property "/data/0/type"

  Scenario: A path whose last part is missing
    Fails with: The JSON response has no "data.0.discount": "data.0" has no "discount".
    Then the JSON response should have "data.0.discount" equal to 10

  Scenario: A wrong value
    Fails with: The JSON response has "data.0.type" equal to "articles", not "people".
    Then the JSON response should have "data.0.type" equal to "people"
