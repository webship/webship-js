Feature: An example to navigate forward and backward one page

As a tester
I want to be able to navigate forward and backward one page

  Scenario: Check to navigate forward and backward one page
    Given I am on the homepage
     When I go to "/about-us.html"
     Then I should see "About Us"
     When I move backward one page
     And I wait max of 3 seconds
     Then I should see "Welcome to the homepage of the Webship-js Examples"
     When I move forward one page
     And I wait max of 3 seconds
     Then I should see "About Us"
