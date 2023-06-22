Feature: Example test for "When I click 'link'"

  As a tester
  I want to be able to test when a link is clicked,
  it will go to the link path page

  Scenario: Check the "When I click link" by link text step definitions
    Given I am on "test--when--i-click-link.html"
      When I click "About us link"
      And I wait max of 2 seconds
      Then I should see "About Us"

  Scenario: Check the "When I click link" by link css class step definitions
    Given I am on "test--when--i-click-link.html"
      When I click "aboutUs"
      And I wait max of 2 seconds
      Then I should see "About Us"
