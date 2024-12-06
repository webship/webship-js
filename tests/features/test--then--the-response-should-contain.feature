Feature: An example to ensure that the response page contains specific text 
  As a tester, 
  I want to navigate to a page to verify whether it contains specific text

  Scenario: Ensure that the response page contains specific text
    Given I am on the homepage
     Then the response should contain "Welcome to the homepage"

  Scenario: Ensure that the response page does not contain specific text
    Given I am on the homepage
     Then the response should not contain "Access denied"