Feature: Web-first text assertions read the text a visitor reads
  As a tester,
  I want "<selector>" should contain text "<text>" to ignore the whitespace the markup carries,
  because a line the markup wraps reads as one line on the page.

  Scenario: Text that the markup wraps onto a second line
    Given I am on "/web-first-text.html"
    Then ".site-footer" should contain text "Powered by Example"
    And ".site-footer" should contain text "Powered by"

  Scenario: Non-breaking spaces count as spaces
    Given I am on "/web-first-text.html"
    Then ".price" should contain text "Price: $99"

  Scenario: The expected text is collapsed too
    Given I am on "/web-first-text.html"
    Then ".site-footer" should contain text "Powered   by    Example"

  Scenario: Should have text stays the exact match
    Given I am on "/web-first-text.html"
    Then ".tagline" should have text "Built with care"
