Feature: Example test for "Then I should be on 'page'"
  As a tester
  I want to be sure I am on "page"

  Scenario: Check "Then I should be on the 'page'" step definition
    Given I am on the homepage
    When I go to "about-us.html"
    Then I should be on "about-us.html"
    When I move backward one page
    Then I should be on "/"