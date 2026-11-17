Feature: An element named by its text, next to the same element named by a selector
  `I should see a "…" element` reads its argument as the exact text of an
  element or of a label; the web-first steps read a CSS selector.

  Scenario: The text of an element and its selector
    Given I am on "/element-selector-hint.html"
    Then I should see a "First news item" element
    And ".news-item" should be visible
    And "header" should be visible

  Scenario: A selector given to the negative is read as a text
    Given I am on "/element-selector-hint.html"
    Then I should not see a ".news-item" element
    And I should not see a "Third news item" element
