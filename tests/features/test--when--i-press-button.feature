Feature: Example test for "When I press button" 

As a tester
I want to be able to test button press event
So that I know it is working

  Scenario: Check the "When I press button" step definitions
    Given I am on the homepage
     When I go to "test--when--i-press-button.html"
     When I press "Click Button"
     Then I should see "Button Pressed Successfully"
