Feature: The API base URL belongs to its scenario
  As a tester,
  I want each scenario to send its API requests where it says
  So that a scenario gives the same result alone and among others

  Scenario: A path is joined to the base URL the scenario set
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"
    Then the API response code should be 200
     And the JSON response should have "data.0.type" equal to "articles"

  Scenario: A base URL with a path of its own
    Given the API base URL is "/examples-that-do-not-exist"
    When I send a GET request to "/example-api.json"
    Then the API response code should be 404

  Scenario: A whole URL is sent as written, with no base URL
    When I send a GET request to "http://localhost:8080/example-api.json"
    Then the API response code should be 200
     And the JSON response should have "included.0.attributes.name" equal to "John"

  Scenario: A whole URL is sent as written, past the base URL
    Given the API base URL is "https://api.example.invalid"
    When I send a GET request to "http://localhost:8080/example-api.json"
    Then the API response code should be 200
