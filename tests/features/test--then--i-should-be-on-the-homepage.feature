Feature: Example test for "Then I should be on the homepage"
  As a tester
  I want to be sure I am on the homepage

  Scenario: Check "Then I should be on the homepage" step definition
    Given I am on the homepage
    When I go to "about-us.html"
    And I move backward one page
    Then I should be on the homepage