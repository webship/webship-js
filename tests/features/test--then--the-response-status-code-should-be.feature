Feature: An example to test a page response status code
  As a tester
  I want to be able to test a page response status code

  Scenario: Check the response status code for not existing page page
    Given I am on the homepage
     When I go to "/not-existing-page.html"
      And I wait 2 seconds
     Then the response status code should be 404
      And the response status code should not be 200

  Scenario: Check the response status code for existing page
    Given I am on the homepage
     When I go to "/existing-page.html"
      And I wait 2 seconds
     Then the response status code should not be 404
      And the response status code should be 200

  Scenario: Check the response status code for an API with JSON page format
    Given I am on the homepage
     When I go to "/example-api.json"
      And I wait 2 seconds
     Then the response status code should not be 404
      And the response status code should be 200

  Scenario: Check the response status code for a parameter of the API with JSON page format
    Given I am on the homepage
     When I go to "/example-api.json?include=author"
      And I wait 2 seconds
     Then the response status code should not be 404
      And the response status code should be 200