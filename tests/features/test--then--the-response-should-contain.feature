Feature: An example to test response page if contain a text 
As a tester, 
I want to be able to navigate to a page 
So that I can check if this page contains a specific text

  Scenario: Check response page if contain a text
    Given I am on the homepage
     Then the response should contain "Welcome to the homepage"

  Scenario: Check response page if not contain a text
    Given I am on the homepage
     Then the response should not contain "Access denied"