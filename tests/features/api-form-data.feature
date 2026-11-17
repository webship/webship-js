Feature: The API form data step sends each field whole
  As a tester,
  I want a form field whose value contains "=" to reach the server as written
  So that a redirect, a query string or a base64 token is not cut

  Scenario: A value that contains "=" is sent whole
    Given the API base URL is "https://jsonplaceholder.typicode.com"
    When I send a POST request to "/posts" with form data:
      """
      redirect=/search?q=shoes
      token=YWJj==

      title=Form data
      """
    Then the API response code should be 201
     And the JSON response should have "redirect" equal to "/search?q=shoes"
     And the JSON response should have "token" equal to "YWJj=="
     And the JSON response should have "title" equal to "Form data"
