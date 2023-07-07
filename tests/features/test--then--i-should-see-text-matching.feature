Feature: An example to test matching certain text to other text on a given page
  As a tester
  I want to be able to check matching certain text to other text on a given page

  Scenario: Check matching certain text to other text on a given page
    Given I am on the homepage
    When I go to "about-us.html"
    Then I should see text matching "About Us"
  
  Scenario: Check not matching certain text to other text on a given page
    Given I am on the homepage
    When I go to "about-us.html"
    Then I should not see text matching "Welcome in homepage"