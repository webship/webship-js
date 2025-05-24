Feature: An example of pressing a button by its label.
      As a tester,
      I want to be able to press a button using its label.

  Scenario: Check pressing a button using its label.
    Given I am on "/test--when--i-press-button.html"
     When I press "Submit"
     Then I should see "Button Pressed Successfully"

  Scenario: Check pressing a selected button with optional button.
    Given I am on "/test--when--i-press-button.html"
     When I press the "Submit" button
     Then I should see "Button Pressed Successfully"
