@must-fail
Feature: An element named by a selector where the step reads a text
  `I should see a "…" element` names the element by its exact visible text or
  by its label. tests/check-must-fail.js runs these scenarios and checks that
  each one fails at its last step with the message its description announces
  (here: the hint that the argument looks like a selector), the address of the
  page and a hint.

  Scenario: A class selector where the step reads a text
    Fails with: ".news-item" looks like a CSS selector, but this step reads it as the exact text of an element or of a label. For a selector, use: ".news-item" should be visible
    Given I am on "/element-selector-hint.html"
    Then I should see a ".news-item" element

  Scenario: A tag name where the step reads a text
    Fails with: "header" looks like a CSS selector, but this step reads it as the exact text of an element or of a label. For a selector, use: "header" should be visible
    Given I am on "/element-selector-hint.html"
    Then I should see a "header" element
