@must-fail
Feature: API response text checks that must fail, and what they say
  Every scenario asserts something about /example-api.json that is not true.
  tests/check-must-fail.js runs them and checks that each one fails at its
  last step with the message its description announces, the request it was
  sent with and a hint.

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: A text that is in the response in another letter case
    Fails with: The API response contains "json:api paints my bikeshed", but it should not.
    Then the API response should not contain "json:api paints my bikeshed"

  Scenario: A placeholder whose value is in the response
    Fails with: The API response contains "John", but it should not.
    Given I set placeholder "{{author}}" to "John"
    Then the API response should not contain "{{author}}"

  Scenario: A text that is not in the response
    Fails with: The API response does not contain "Completely different words".
    Then the API response should contain "Completely different words"
