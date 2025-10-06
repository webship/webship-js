Feature: An example of ensuring that a pattern matches the text on a specific page.
  As a developer,
  I want to ensure that a pattern matches the text in a specific page.

  Scenario: Ensure that there is a text matching the pattern of text starting with 'T' on a specific page
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "^T\w+"

  Scenario: Ensure that there is no text matching the pattern of text starting with 'O' on a specific page
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should not see text matching "^O\w+"

  Scenario: Ensure that there is text matching the email pattern on a specific page
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "[a-z0-9]+@[a-z]+\.[a-z]{2,3}"