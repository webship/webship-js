Feature: An element at the top of the viewport
  `the element "<selector>" should be at the top of the viewport` passes when
  the top of the element is between 0 and 100 pixels from the top of the
  viewport, and looks again for up to 5 seconds.

  Scenario: An element already at the top
    Given I am on "/viewport-top.html"
    Then the element "#section-1" should be at the top of the viewport

  Scenario: An element that gets there a moment after the click
    Given I am on "/viewport-top.html"
    When I click "Go to section 3"
    Then the element "#section-3" should be at the top of the viewport
