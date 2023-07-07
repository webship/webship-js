Feature: An example to press a button

  As a tester
  I want to be able to press a button

  Scenario: Check press a button
    Given I am on the homepage
    When I go to "test--when--i-press-button.html"
    When I press "Submit"
    Then I should see "Button Pressed Successfully"
