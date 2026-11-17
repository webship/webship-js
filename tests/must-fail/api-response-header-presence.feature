@must-fail
Feature: API response header presence checks that must fail, and what they say
  Every scenario asserts a header of /example-api.json is there, or is not,
  when the opposite is true. tests/check-must-fail.js checks the message, the
  request and the hint.

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: A header the response does not have
    Fails with: The API response has no "X-Powered-By" header.
    Then the API response should contain the header "X-Powered-By"

  Scenario: A header the response has
    Fails with: The API response has the header "ETag", but it should not.
    Then the API response should not contain the header "ETag"
