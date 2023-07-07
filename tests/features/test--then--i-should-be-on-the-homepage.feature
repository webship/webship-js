Feature: An example to test being on the homepage
  As an anonymous user
  I want to be sure I am on the homepage

  Scenario: Check being on the homepage
    Given I am on the homepage
    When I go to "about-us.html"
    And I move backward one page
    Then I should be on the homepage