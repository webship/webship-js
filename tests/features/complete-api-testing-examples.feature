Feature: Complete API Testing Examples - All Step Definitions
  As a developer,
  I want to test all available API step definitions
  So that I can verify comprehensive API testing capabilities.

  Background:
    Given the API base URL is "https://jsonplaceholder.typicode.com"

  Scenario: Basic Authentication and Headers
    Given I am authenticating as "admin" with "password123" password
      And I set header "Content-Type" with value "application/json"
      And I set header "Accept" with value "application/json"
     When I send a GET request to "/posts/1"
     Then the API response code should be 200

  Scenario: Alternative Header Syntax
    Given I set the header "Content-Type" to "application/json"
      And the header "Accept" is "application/json"
     When I send a GET request to "/posts/1"
     Then the API response code should be 200

  Scenario: Multiple Headers Using Table
    Given I set the following headers:
      | Content-Type  | application/json |
      | Accept        | application/json |
      | User-Agent    | WebshipJS/1.0   |
    When I send a GET request to "/posts"
    Then the API response code should be 200

  Scenario: GET Request with Response Validation
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    And the API response should contain "userId"
    And the API response should contain "title"
    And the API response should not contain "password"

  Scenario: POST Request with JSON Body (String)
    Given I set the request body to '{"title": "Test Post", "body": "This is a test post", "userId": 1}'
    When I send a POST request to "/posts"
    Then the API response code should be 201
    And the API response should contain "Test Post"

  Scenario: POST Request with Table Body
    Given I set the request body with:
      | title  | My New Post           |
      | body   | This is the content   |
      | userId | 1                     |
    When I send a POST request to "/posts"
    Then the API response code should be 201

  Scenario: POST Request with Values Table
    When I send a POST request to "/posts" with values:
      | title  | Table Post            |
      | body   | Created with table    |
      | userId | 1                     |
    Then the API response code should be 201
    And the API response should contain "Table Post"

  Scenario: POST Request with DocString Body
    When I send a POST request to "/posts" with body:
      """
      {
        "title": "DocString Post",
        "body": "Created with docstring",
        "userId": 1
      }
      """
    Then the API response code should be 201
    And the API response should contain "DocString Post"

  Scenario: Form Data Request
    When I send a POST request to "/posts" with form data:
      """
      title=Form Data Post
      body=Created with form data
      userId=1
      """
    Then the API response code should be 201

  Scenario: PUT Request for Update
    Given I set the request body to '{"id": 1, "title": "Updated Post", "body": "Updated content", "userId": 1}'
    When I send a PUT request to "/posts/1"
    Then the API response code should be 200
    And the API response should contain "Updated Post"

  Scenario: PATCH Request
    Given I set the request body to '{"title": "Patched Title"}'
    When I send a PATCH request to "/posts/1"
    Then the API response code should be 200

  Scenario: DELETE Request
    When I send a DELETE request to "/posts/1"
    Then the API response code should be 200

  Scenario: JSON Response Structure Validation
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    And the response should be valid JSON
    And the JSON response should have property "id"
    And the JSON response should have property "title"
    And the JSON response should have property "body"
    And the JSON response should have property "userId"
    And the JSON response should not have property "password"

  Scenario: Specific JSON Property Values
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    And the JSON property "userId" should be 1
    And the JSON property "id" should be 1

  Scenario: JSON Structure Validation with DocString
    When I send a POST request to "/posts" with body:
      """
      {
        "title": "Test Title",
        "body": "Test Body",
        "userId": 1
      }
      """
    Then the API response code should be 201
    And the API response should contain json:
      """
      {
        "title": "Test Title",
        "body": "Test Body",
        "userId": 1
      }
      """

  Scenario: Response Header Validation
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    And the response header "Content-Type" should be "application/json"

  Scenario: Placeholder Usage
    Given I set placeholder "{{postId}}" to "1"
    And I set placeholder "{{userId}}" to "1"
    When I send a GET request to "/posts/{{postId}}"
    Then the API response code should be 200
    And the JSON property "userId" should be {{userId}}
    And the JSON property "id" should be {{postId}}

  Scenario: Complex Scenario with All Features
    Given I set placeholder "{{newTitle}}" to "Complex API Test"
    And I set placeholder "{{newBody}}" to "Testing all features together"
    And I set the following headers:
      | Content-Type | application/json      |
      | Accept       | application/json      |
      | User-Agent   | WebshipJS-Testing/1.0 |
    And I set the request body to '{"title": "{{newTitle}}", "body": "{{newBody}}", "userId": 1}'
    When I send a POST request to "/posts"
    Then the API response code should be 201
    And the response should be valid JSON
    And the API response should contain "Complex API Test"
    And the API response should contain "Testing all features together"
    And the JSON response should have property "id"
    And the JSON response should have property "title"
    And the JSON response should have property "body"
    And the JSON response should have property "userId"
    And print API response

  Scenario: Error Handling Test
    When I send a GET request to "/posts/999999"
    Then the API response code should be 404

  Scenario: Array Response Testing
    When I send a GET request to "/posts"
    Then the API response code should be 200
    And the response should be valid JSON

  Scenario: Different HTTP Methods Testing
    # Test all supported HTTP methods
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    
    Given I set the request body to '{"title": "Test", "body": "Test", "userId": 1}'
    When I send a POST request to "/posts"
    Then the API response code should be 201
    
    Given I set the request body to '{"id": 1, "title": "Updated", "body": "Updated", "userId": 1}'
    When I send a PUT request to "/posts/1"
    Then the API response code should be 200
    
    Given I set the request body to '{"title": "Patched"}'
    When I send a PATCH request to "/posts/1"
    Then the API response code should be 200
    
    When I send a DELETE request to "/posts/1"
    Then the API response code should be 200

  Scenario: Nested JSON Property Testing
    When I send a GET request to "/users/1"
    Then the API response code should be 200
    And the JSON response should have property "address.city"
    And the JSON response should have property "company.name"

  Scenario: Boolean and Number Property Testing
    Given I set the request body with:
      | title     | Test Post      |
      | body      | Test content   |
      | userId    | 1              |
      | published | true           |
      | views     | 100            |
    When I send a POST request to "/posts"
    Then the API response code should be 201