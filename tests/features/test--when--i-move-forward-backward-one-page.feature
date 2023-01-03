Feature: Example test for "I move forword one page",and "I move backword one page" 

As a tester
I want to be able to test the navigate forward and backward in the browser history
So that I know it is working

  Scenario: Check the "Navigate forward and backward" step definitions
    Given I am on the homepage
     When I go to "about-us.html"
     When I move backward one page
     When I move forward one page
     Then I should see "About Us"
     When I move backward one page
     Then I should see "Welcome to the homepage of the Webship-js Examples"
