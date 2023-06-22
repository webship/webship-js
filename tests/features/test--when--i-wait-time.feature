Feature: Example test for Wait a Specific/Max number of seconds/minutes for page load
  As a tester
  I want to make sure that I can wait for a page to load, an element to visible

  Scenario: Check page content to load
    Given I am on the homepage
    When I go to "test--when-i-wait-specific-time.html"
    And I wait 6 seconds
    Then I should see "Welcome with waiting full time"

  Scenario: Check page content to load
    Given I am on the homepage
    When I go to "test--when-i-wait-max-of-time.html"
    And I wait max of 6 seconds
    Then I should see "Welcome with waiting until page load"