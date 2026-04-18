Feature: Follow a link by its visible text
  As a tester,
  I want to follow a link by its visible anchor text
  so that scenarios read like a user journey.

  Scenario: Follow a link by its visible text
    Given I am on "/test--when--i-click-link.html"
     When I follow "About us link"
      And I wait max of 2 seconds
     Then I should see "About Us"

  Scenario: Follow a link using the "we" pronoun
    Given I am on "/test--when--i-click-link.html"
     When we follow "About us link"
      And I wait max of 2 seconds
     Then I should see "About Us"

  Scenario: Follow a link with no pronoun
    Given I am on "/test--when--i-click-link.html"
     When follow "About us link"
      And I wait max of 2 seconds
     Then I should see "About Us"
