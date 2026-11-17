Feature: The API response text checks read the response the same way in both polarities
  As a tester,
  I want "should contain" and "should not contain" to agree on letter case and placeholders
  So that a negative check fails on the text a positive check finds

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: Letter case does not matter to either polarity
    Then the API response code should be 200
     And the API response should contain "JSON:API paints my bikeshed!"
     And the API response should contain "json:api paints my bikeshed!"
     And the API response should not contain "Jane"
     And the API response should not contain "jane"

  Scenario: A placeholder in the expected text is replaced
    Given I set placeholder "{{author}}" to "John"
      And I set placeholder "{{nobody}}" to "Jane"
    Then the API response should contain "{{author}}"
     And the API response should not contain "{{nobody}}"
