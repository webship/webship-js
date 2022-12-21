Feature: Example test for "I go to" 
As a tester
I want to be able to test the I-go-to site
So that I know it is working

  Scenario: Check the "I go to" step definition
    Given I go to "http://localhost:8080/I-go-to-homepage"
     Then I should see "Welcome"
