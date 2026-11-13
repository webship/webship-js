Feature: REST and API requests follow the HTTPS setting of the browser
  As a tester,
  I want the REST and API request steps to reach every site the browser reaches
  So that they work on a site served over HTTPS with a self-signed or locally issued certificate

  Background:
    Given the API base URL is "/"

  Scenario: A REST GET request to a path
    When I send a REST "GET" request to "/example-api.json"
    Then the REST response status code should be 200
     And the REST response should contain "JSON:API paints my bikeshed!"
     And the REST response should contain "articles"

  Scenario: A REST GET request to an absolute URL
    When I send a REST "GET" request to "http://localhost:8080/example-api.json"
    Then the REST response status code should be 200
     And the REST response should contain "The shortest article. Ever."

  Scenario: A REST GET request to a missing page answers 404
    When I send a REST "GET" request to "/not-existing-page.json"
    Then the REST response status code should be 404

  Scenario: A REST request after the browser opened a page
    Given I am on "/about-us.html"
    When we send a REST "GET" request to "/example-api.json"
    Then the REST response status code should be 200
     And the REST response should contain "people"
     And I should see "About Us"

  Scenario: A REST POST request with a JSON body to a path that takes no POST
    Given a REST header "Content-Type" with value "application/json"
    When I send a REST "POST" request to "/example-api.json" with body:
      """
      {"title": "Webship", "body": "A REST request with a JSON body"}
      """
    Then the REST response status code should be 405

  Scenario: A REST POST request with a JSON body to an absolute URL
    Given a REST header "Content-Type" with value "application/json"
    When I send a REST "POST" request to "https://jsonplaceholder.typicode.com/posts" with body:
      """
      {"title": "Webship", "body": "A REST request with a JSON body", "userId": 1}
      """
    Then the REST response status code should be 201
     And the REST response should contain "Webship"
     And the REST response should contain "A REST request with a JSON body"
     And the REST response should contain "id"

  Scenario: A REST DELETE request to an absolute URL
    When I send a REST "DELETE" request to "https://jsonplaceholder.typicode.com/posts/1"
    Then the REST response status code should be 200

  Scenario: An API GET request to a path under the launch URL
    When I send a GET request to "/example-api.json"
    Then the API response code should be 200
     And the response should be valid JSON
     And the response header "Content-Type" should contain "application/json"
     And the JSON response should have "data.0.type" equal to "articles"
     And the JSON response should have "included.0.attributes.name" equal to "John"
     And the JSON property "included.0.attributes.age" should be 80
     And the JSON response should have property "data.0.relationships.author"
     And the JSON response should not have property "data.0.password"
     And the API response should contain "JSON:API paints my bikeshed!"

  Scenario: An API GET request to an absolute base URL
    Given the API base URL is "http://localhost:8080"
    When I send a GET request to "/example-api.json"
    Then the API response code should be 200
     And the header "Content-Type" should contain "application/json"
     And the JSON response should have "data.0.id" equal to "1"

  Scenario: An API GET request to a missing page answers 404
    When I send a GET request to "/not-existing-page.json"
    Then the API response code should be 404
     And the API response should not contain "articles"

  Scenario: An API POST request with a JSON body to a path that takes no POST
    When I send a POST request to "/example-api.json" with body:
      """
      {"title": "Webship", "body": "An API request with a JSON body"}
      """
    Then the API response code should be 405

  Scenario: An API POST request with a JSON body to an absolute base URL
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/posts" with body:
      """
      {"title": "Webship", "body": "An API request with a JSON body", "userId": 1}
      """
    Then the API response code should be 201
     And the response should be valid JSON
     And the response header "Content-Type" should contain "application/json"
     And the JSON response should have "title" equal to "Webship"
     And the JSON response should have "userId" equal to 1
     And the JSON response should have property "id"

  Scenario: An API POST request with values and with form data
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/posts" with values:
      | title | Webship         |
      | body  | Sent as values  |
    Then the API response code should be 201
     And the JSON response should have "title" equal to "Webship"
    When I send a POST request to "/posts" with form data:
      """
      title=Webship
      body=Sent as form data
      """
    Then the API response code should be 201
     And the JSON response should have "body" equal to "Sent as form data"

  Scenario: An API request with a request body set before it and basic authentication
    Given the API base URL is "https://jsonplaceholder.typicode.com"
      And I am authenticating as "tester" with "secret" password
      And I set the request body to '{"title": "Webship", "userId": 7}'
    When I send a PUT request to "/posts/1"
    Then the API response code should be 200
     And the JSON response should have "title" equal to "Webship"
     And the JSON response should have "userId" equal to 7
