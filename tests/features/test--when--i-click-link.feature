Feature: An example to click link

  As a tester
  I want to be able to click link

  Scenario: Check click link by link text
    Given I am on "/test--when--i-click-link.html"
      When I click "#aboutUsid"
      And I wait max of 2 seconds
      Then I should see "About Us"

  Scenario: Check click link by link css class
    Given I am on "/test--when--i-click-link.html"
      When I click ".aboutUs"
      And I wait max of 2 seconds
      Then I should see "About Us"
