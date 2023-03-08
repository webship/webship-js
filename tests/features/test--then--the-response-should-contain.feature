Feature: Example test for Then the response should contain "text" 
As a tester, 
I want to be able to navigate to a page 
So that I can check if this page contains a specific text

  Scenario: Check the response should contain "text" 
    Given I am on the homepage
     Then the response should contain "Welcome to the homepage"

  Scenario: Check the response should not contain "text" 
    Given I am on the homepage
     Then the response should not contain "Access denied"