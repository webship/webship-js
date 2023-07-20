Feature: Example test for: Then I should see "text" in the "element" element
  As a developer
  I want to be able to check an element if it has a particular text or not

Scenario: Check an element if it has a pattern text or not
    Given I am on "test--then--i-should--see-text-matching-pattern.html"
    Then I should see text matching "^T\w+"