Feature: An example to ensure that you are on the homepage
      As an anonymous user,
      I want to ensure that I am on the homepage

  Scenario: Ensure that you are on the homepage
    Given I am on the homepage
     When I go to "/about-us.html"
      And I move backward one page
      And I wait max of 3 seconds
     Then I should be on the homepage