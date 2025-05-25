Feature: An example of reloading the page.
      As a tester,
      I want to be able to reload the page.

  Scenario: Check reloading the page.
    Given I am on "/test--when--i-reload-page.html"
     When I press "Submit" by attr
     Then I should see "Button Pressed Successfully"
     When I reload the page
     Then I should not see "Button Pressed Successfully"
     
