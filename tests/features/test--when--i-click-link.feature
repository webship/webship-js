Feature: An example to click link

  As a tester
  I want to be able to click link

  Scenario: Check click link by link text
    Given I am on "/test--when--i-click-link.html"
      When I click "About us link"
      And I wait max of 2 seconds
      Then I should see "About Us"