Feature: An example of testing to match a pattern to text on a specific page
  As a developer
  I want to be able to check if I can see text matching the pattern I require.

Scenario: Check if not exist a text has a pattern match with text start with "O"
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should not see text matching "^O\w+"

Scenario: Check if exist a text has a pattern match with Email
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "[a-z0-9]+@[a-z]+\.[a-z]{2,3}"