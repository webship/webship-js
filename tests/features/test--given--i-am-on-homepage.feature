Feature: Example test for "I am on the homepage" 
As a tester
I want to be able to navigate to the homepage
So that I can check the welcome message at homepage

  Scenario: Check the homepage step definition
    Given I am on the homepage
     Then I should see "Welcome to the homepage of the Webship-js Examples"

  Scenario: Check homepage step definition
    Given I am on homepage
     Then I should see "Welcome to the homepage of the Webship-js Examples"
