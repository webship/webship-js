Feature: The API headers and body tables send every row
  As a tester,
  I want the first row of a headers or body table to be sent like the others
  So that no header and no field is silently left out

  Scenario: The first row of the headers table is sent
    Given the API base URL is "/"
      And I set the following headers:
        | Range  | bytes=0-9        |
        | Accept | application/json |
    When I send a GET request to "/example-api.json"
    Then the API response code should be 206

  Scenario: A headers table that starts with a row naming its columns
    Given the API base URL is "/"
      And I set the following headers:
        | header | value     |
        | Range  | bytes=0-9 |
    When I send a GET request to "/example-api.json"
    Then the API response code should be 206

  Scenario: The first row of the request body table is sent
    Given the API base URL is "https://jsonplaceholder.typicode.com"
      And I set the request body with:
        | title  | First row |
        | userId | 1         |
    When I send a POST request to "/posts"
    Then the API response code should be 201
     And the JSON response should have "title" equal to "First row"
     And the JSON response should have "userId" equal to 1

  Scenario: A request body table that starts with a row naming its columns
    Given the API base URL is "https://jsonplaceholder.typicode.com"
      And I set the request body with:
        | field | value      |
        | title | Second row |
    When I send a POST request to "/posts"
    Then the API response code should be 201
     And the JSON response should have "title" equal to "Second row"
     And the JSON response should not have property "field"
