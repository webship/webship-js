Feature: An example to reload the page

As a tester
I want to be able to reload the page

  Scenario: Check to reload the page
    Given I am on the homepage
     When I go to "test--when--i-reload-page.html"
     When I press "Submit"
     Then I should see "Button Pressed Successfully"
     When I reload the page
     Then I should not see "Button Pressed Successfully"
     
