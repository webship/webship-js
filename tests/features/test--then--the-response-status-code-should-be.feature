Feature: An example to check the status code of a page response
  As a tester,
  I want to be able to check the status code of a page response

  Scenario: Check the response status code for a non-existing page
    Given I am on the homepage
     When I go to "/not-existing-page.html"
      And I wait max of 2 seconds
     Then the response status code should be 404
      And the response status code should not be 200

  Scenario: Check the response status code for an existing page
    Given I am on the homepage
     When I go to "/existing-page.html"
      And I wait max of 2 seconds
     Then the response status code should not be 404
      And the response status code should be 200

  Scenario: Check the response status code for an API that returns a JSON format
    Given I am on the homepage
     When I go to "/example-api.json"
      And I wait max of 2 seconds
     Then the response status code should not be 404
      And the response status code should be 200

  Scenario: Check the response status code for a parameter in the API that returns JSON format
    Given I am on the homepage
     When I go to "/example-api.json?include=author"
      And I wait max of 2 seconds
     Then the response status code should not be 404
      And the response status code should be 200