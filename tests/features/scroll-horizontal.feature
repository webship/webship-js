Feature: Horizontal scrolling step definitions
  As a tester,
  I want to scroll a page and an element to the right, to the left, to the start and to the end,
  so that content wider than the window can be reached.

  Scenario: Scroll right by the default distance
    Given I am on "/scroll-horizontal.html"
     Then "#page-position" should have text "Page scrolled 0 pixels to the right"
     When I scroll right
     Then "#page-position" should have text "Page scrolled 350 pixels to the right"

  Scenario: Scroll right by a custom distance
    Given I am on "/scroll-horizontal.html"
     When I scroll right 1000
     Then "#page-position" should have text "Page scrolled 1000 pixels to the right"

  Scenario: Scroll left by the default distance
    Given I am on "/scroll-horizontal.html"
     When I scroll right 1000
      And I scroll left
     Then "#page-position" should have text "Page scrolled 650 pixels to the right"

  Scenario: Scroll left by a custom distance
    Given I am on "/scroll-horizontal.html"
     When I scroll right 1000
      And I scroll left 300
     Then "#page-position" should have text "Page scrolled 700 pixels to the right"

  Scenario: Scroll to the end of the page
    Given I am on "/scroll-horizontal.html"
     Then "#page-edge" should have text "Page is at the start"
     When I scroll to the end
     Then "#page-edge" should have text "Page is at the end"

  Scenario: Scroll to the start of the page
    Given I am on "/scroll-horizontal.html"
     When I scroll to the end of the page
     Then "#page-edge" should have text "Page is at the end"
     When I scroll to the start of the page
     Then "#page-edge" should have text "Page is at the start"
      And "#page-position" should have text "Page scrolled 0 pixels to the right"

  Scenario: Scroll to the end of an element
    Given I am on "/scroll-horizontal.html"
     Then "#strip-edge" should have text "Strip is at the start"
     When I scroll to end of "#strip"
     Then "#strip-edge" should have text "Strip is at the end"
      And "#page-position" should have text "Page scrolled 0 pixels to the right"

  Scenario: Scroll to the start of an element
    Given I am on "/scroll-horizontal.html"
     When I scroll to end of "#strip"
     Then "#strip-edge" should have text "Strip is at the end"
     When I scroll to start of "#strip"
     Then "#strip-edge" should have text "Strip is at the start"
