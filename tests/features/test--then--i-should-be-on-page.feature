Feature: An example to test being on a specific page
  As an anonymous user
  I want to be sure I am on a specific page

  Scenario: Check being on a specific page
    Given I am on the homepage
    When I go to "/about-us.html"
    Then I should be on "/about-us.html"
    When I move backward one page
    Then I should be on homepage