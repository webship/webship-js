Feature: Assert the exact number of elements matching a selector
  As a tester,
  I want to assert how many elements match a CSS selector
  so that I can catch regressions in list lengths, card counts, and nav items.

  Scenario: Count h1 headings on the homepage
    Given I am on homepage
     Then I should see 1 "h1" element

  Scenario: Count list items inside the first list on the homepage
    Given I am on homepage
     Then I should see 13 "ul:first-of-type li" elements

  Scenario: Expect zero matches for a missing selector
    Given I am on homepage
     Then I should see 0 ".does-not-exist" elements

  Scenario: Pronoun variant — "we"
    Given I am on homepage
     Then we should see 1 "h1" element

  Scenario: No pronoun
    Given I am on homepage
     Then should see 1 "h1" element
