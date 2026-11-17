@must-fail
Feature: A name of the selector registry given to a step that does not read it
  A step that takes a text, a label or a CSS selector in quotes does not read
  the selector registry. tests/check-must-fail.js runs these scenarios and
  checks that each one fails at its last step with the message its
  description announces (here: the hint that names the registry), the address
  of the page and a hint.

  Scenario: A registered name given to a web-first step
    Fails with: "premium-banner" is a name of the selector registry (.promo-banner), but this step does not read the registry. Use: I see visible premium-banner, or: ".promo-banner" should be visible
    Given I am on "/registered-names.html"
    When I add "premium-banner" selector for ".promo-banner" css selector
    Then "premium-banner" should be visible

  Scenario: A registered name given to an element step
    Fails with: "premium-banner" is a name of the selector registry (.promo-banner), but this step does not read the registry. Use: the element ".promo-banner" should be at the top of the viewport
    Given I am on "/registered-names.html"
    When I add "premium-banner" selector for ".promo-banner" css selector
    Then the element "premium-banner" should be at the top of the viewport

  Scenario: A registered name given to the fill step
    Fails with: "search box" is a name of the selector registry (.search-box input), but this step does not read the registry. Use: I fill in the field ".search-box input" with "laptops"
    Given I am on "/registered-names.html"
    When I add "search box" selector for ".search-box input" css selector
    And I fill in "search box" with "laptops"
