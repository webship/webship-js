Feature: An example to test a page response status code
  As a tester
  I want to be able to test a page response status code

  Scenario: Check the response status code for current page
    Given I am on the homepage
    When I go to "/not-exist-page.html"
    Then the response status code should be 404

  Scenario: Check the response status code for current page
    Given I am on the homepage
    When I go to "/about-us.html"
    Then the response status code should not be 404