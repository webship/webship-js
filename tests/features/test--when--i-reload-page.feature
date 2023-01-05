Feature: Example test for "When I reload page" 

As a tester
I want to be able to test page reload
So that I know it is working

  Scenario: Check the "When I reload page" step definitions
    Given I am on the homepage
     When I go to "test--when--i-reload-page.html"
     When I press "Click Button"
     Then I should see "Button Pressed Successfully"
     When I reload the page
     Then I should not see "Button Pressed Successfully"
     
