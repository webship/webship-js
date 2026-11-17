Feature: The API response header steps tell "should be" from "should contain"
  As a tester,
  I want "should be" to compare the whole value of a header
  So that a wrong value that contains the right text does not pass

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: The whole value of a header
    Then the response header "Content-Type" should be "application/json; charset=UTF-8"
     And the header "content-type" should be "application/json; charset=UTF-8"
     And the response header "Accept-Ranges" should be "bytes"

  Scenario: A part of the value of a header
    Then the response header "Content-Type" should contain "application/json"
     And the header "CONTENT-TYPE" should contain "charset"
