@must-fail
Feature: An API request without a base URL must fail, and say why
  The API base URL belongs to the scenario that sets it. A scenario that sets
  none fails at its first request with a path, even when another scenario of
  the run set one before it (the scenarios of api-response-contains.feature
  run first and set "/"). tests/check-must-fail.js checks the message, the
  request and the hint.

  Scenario: A request to a path in a scenario that set no base URL
    Fails with: No API base URL is set, so "/example-api.json" has no address.
    When I send a GET request to "/example-api.json"
