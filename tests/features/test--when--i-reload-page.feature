Feature: Example test for "I reload the page" 
As a tester
I want to be able to test the I-reload-page site
So that I know it is working

  Scenario: Check the "I reload page" step definition
    Given I am on "test--when--i-reload-page.html"
     When I reload the page
     Then I should see "Reloaded page"
 
