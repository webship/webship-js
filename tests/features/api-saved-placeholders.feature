Feature: A value of an API response carried into later requests
  As a tester,
  I want to save a property of a response as a placeholder
  So that a token or an id the API returned goes into the next requests

  Scenario: A property saved as a placeholder, in a URL and a body
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    When I save the JSON property "userId" as placeholder "{{author}}"
     And we save the JSON property "title" as placeholder "{{title}}"
     And I send a GET request to "/users/{{author}}"
    Then the API response code should be 200
     And the JSON response should have "id" equal to 1
    When I send a POST request to "/posts" with body:
      """
      {"title": "{{title}}", "userId": {{author}}}
      """
    Then the API response code should be 201
     And the JSON response should have "userId" equal to 1
     And the API response should contain "{{title}}"

  Scenario: A header set before its placeholder has a value gets it when the request is sent
    Given the API base URL is "/"
      And I set the header "Range" to "bytes=0-{{last}}"
      And I set placeholder "{{last}}" to "9"
    When I send a GET request to "/example-api.json"
    Then the API response code should be 206

  Scenario: A value with characters that mean something in a pattern
    Given I set placeholder "{{price}}" to "$1.50 (incl. $&)"
      And the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/posts" with body:
      """
      {"title": "{{price}}", "userId": 1}
      """
    Then the JSON response should have "title" equal to "$1.50 (incl. $&)"
