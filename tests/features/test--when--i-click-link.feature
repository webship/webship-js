Feature: An example of clicking a link by its text

  As a tester, 
  I want to be able to click a link based on its text

  Scenario: Verify clicking a link by its text
    Given I am on "/test--when--i-click-link.html"
     When I click "About us link"
      And I wait max of 2 seconds
     Then I should see "About Us"