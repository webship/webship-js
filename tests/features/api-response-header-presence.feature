Feature: The API steps tell whether a response header is there
  As a tester,
  I want to check that an API response has a header, or has not, whatever its value
  So that a missing ETag or a leaking server header is caught

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: Headers the response has
    Then the API response should contain the header "ETag"
     And the API response should contain the header "content-type"
     And API response should contain the header "Accept-Ranges"

  Scenario: Headers the response has not
    Then the API response should not contain the header "X-Powered-By"
     And the API response should not contain the header "Set-Cookie"
