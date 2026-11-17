Feature: Names of the selector registry are read by the bare-name steps
  A name added to the selector registry is read by the bare-name steps of the
  selector family (`I see visible <name>`, `I click <name>`). The steps that
  take a text, a label or a CSS selector in quotes read their argument as it
  is written, so they are given the selector itself.

  Scenario: The bare-name steps and the selector itself
    Given I am on "/registered-names.html"
    When I add "premium-banner" selector for ".promo-banner" css selector
    And I add "search box" selector for ".search-box input" css selector
    Then I see visible premium-banner
    And ".promo-banner" should be visible
    When I fill in the field ".search-box input" with "laptops"
    Then ".search-box input" should have value "laptops"
