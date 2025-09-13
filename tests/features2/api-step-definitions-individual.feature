Feature: API Step Definitions Individual
  As a developer,
  I want to see individual examples of each API step definition
  So that I can understand how to use each one.

  # ======================
  # SETUP STEP DEFINITIONS
  # ======================

  Scenario: Authentication Step
    # Basic Authentication
    Given I am authenticating as "admin" with "password123" password

  Scenario: Base URL Setup
    # Different ways to set base URL
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    # Alternative syntax:
    # Given I set the API base URL to "https://api.example.com/v1"
    # Given the base URL is "http://localhost:3000/api"

  Scenario: Single Header Setup
    # Different ways to set headers
    Given I set header "Content-Type" with value "application/json"
    # Alternative syntax:
    # Given I set the header "Authorization" to "Bearer token123"
    # Given the header "Accept" is "application/json"

  Scenario: Multiple Headers Setup
    Given I set the following headers:
      | Content-Type  | application/json |
      | Authorization | Bearer token123  |
      | Accept        | application/json |

  Scenario: Request Body with JSON String
    Given I set the request body to '{"name": "John", "email": "john@example.com"}'

  Scenario: Request Body with Table
    Given I set the request body with:
      | name  | John Doe           |
      | email | john@example.com   |
      | age   | 30                 |

  Scenario: Placeholder Setup
    Given I set placeholder "{{userId}}" to "123"
    Given I set placeholder "{{baseUrl}}" to "https://api.example.com"

  # ======================
  # WHEN STEP DEFINITIONS (HTTP Requests)
  # ======================

  Scenario: Basic HTTP Requests
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    # Different HTTP methods
    When I send a GET request to "/users"
    When I send a POST request to "/posts" 
    When I send a PUT request to "/users/1"
    When I send a DELETE request to "/posts/1"
    When I send a PATCH request to "/users/1"

  Scenario: Request with Values Table
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/users" with values:
      | name  | John Doe         |
      | email | john@example.com |
      | age   | 30               |

  Scenario: Request with Body DocString
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/users" with body:
      """
      {
        "name": "John Doe",
        "email": "john@example.com"
      }
      """

  Scenario: Request with Form Data
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/login" with form data:
      """
      username=admin
      password=secret
      remember=true
      """

  # ======================
  # THEN STEP DEFINITIONS (Assertions)
  # ======================

  Scenario: Status Code Assertions
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    # Alternative syntax:
    # Then API response code should be 404

  Scenario: Content Assertions
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then the API response should contain "userId"
    Then the API response should not contain "password"
    # Alternative syntax:
    # Then API response should contain "John Doe"
    # Then API response should not contain "failed"

  Scenario: JSON Structure Assertions
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then the response should be valid JSON
    Then the JSON response should have property "id"
    Then the JSON response should not have property "password"
    # Alternative syntax:
    # Then the API response should be valid JSON
    # Then the API response should contain property "user.email"
    # Then the API response should not contain property "secret"

  Scenario: JSON Property Value Assertions
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then the JSON property "userId" should be 1
    Then the JSON property "id" equal to 1
    # Alternative syntax:
    # Then the JSON response should have "name" should be "John"
    # Then the API response should have "active" equal to true

  Scenario: JSON Content Assertion with DocString
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    And I set the request body to '{"title": "Test Post", "body": "Test content", "userId": 1}'
    When I send a POST request to "/posts"
    Then the API response should contain json:
      """
      {
        "title": "Test Post",
        "body": "Test content",
        "userId": 1
      }
      """

  Scenario: Header Assertions
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then the response header "Content-Type" should be "application/json"
    # Alternative syntax:
    # Then the header "Cache-Control" should contain "no-cache"

  Scenario: Debug Step
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a GET request to "/posts/1"
    Then print API response

  # ======================
  # COMPLETE WORKFLOW EXAMPLES
  # ======================

  Scenario: Complete CRUD Operations
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    
    # CREATE
    And I set the request body to '{"title": "New Post", "body": "Post content", "userId": 1}'
    When I send a POST request to "/posts"
    Then the API response code should be 201
    And the API response should contain "New Post"
    
    # READ
    When I send a GET request to "/posts/1"
    Then the API response code should be 200
    And the JSON response should have property "title"
    
    # UPDATE
    And I set the request body to '{"id": 1, "title": "Updated Post", "body": "Updated content", "userId": 1}'
    When I send a PUT request to "/posts/1"
    Then the API response code should be 200
    
    # DELETE
    When I send a DELETE request to "/posts/1" 
    Then the API response code should be 200

  Scenario: Using Placeholders
    Given I set placeholder "{{userId}}" to "1"
    And I set placeholder "{{postTitle}}" to "Dynamic Title"
    And the API base URL is "https://jsonplaceholder.typicode.com"
    And I set the request body to '{"title": "{{postTitle}}", "body": "Content", "userId": {{userId}}}'
    When I send a POST request to "/posts"
    Then the API response code should be 201
    And the API response should contain "Dynamic Title"