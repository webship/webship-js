@must-fail
Feature: API response header checks that must fail, and what they say
  Every scenario asserts something about the headers of /example-api.json
  that is not true. tests/check-must-fail.js checks the message, the request
  and the hint.

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: "should be" given a part of the value
    Fails with: The response header "Content-Type" is "application/json; charset=UTF-8", not "json".
    Then the response header "Content-Type" should be "json"

  Scenario: "should contain" given a text the value does not hold
    Fails with: The response header "Content-Type" does not contain "text/html".
    Then the response header "Content-Type" should contain "text/html"

  Scenario: A header the response does not have
    Fails with: The API response has no "X-Not-Sent" header.
    Then the header "X-Not-Sent" should be "anything"
