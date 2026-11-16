Feature: Element step definitions

  Scenario: Element existence and attribute matching
    Given I am on "/element.html"
     Then the element "h1" with the attribute "data-test" and the value "hero" should exist
      And the element "h1" with the attribute "data-test" and the value containing "her" should exist
      And the element "h1" with the attribute "data-test" and the value "missing" should not exist
      And the element "h1" should be displayed
      And the element "#hidden" should not be displayed
      And the element ".lead[data-role='outro']" should appear after the element ".lead[data-role='intro']"
      And the text "Second paragraph" should appear after the text "First paragraph"

  Scenario: Click and hover via element steps
    Given I am on "/element.html"
     When I click on the element "#btn"
     Then I should see "clicked"

  Scenario: No element has an attribute value containing a text
    Given I am on "/element.html"
     Then the element "p" with the attribute "data-role" and the value containing "tro" should exist
      And the element "p" with the attribute "data-role" and the value containing "missing" should not exist

  Scenario: Trigger a JS event on an element
    Given I am on "/element-viewport.html"
     Then "#event-log" should have text "No event yet"
     When I trigger the JS event "change" on the element "#country"
     Then "#event-log" should have text "The change event reached the country field"
     When I trigger the JS event "webship-ping" on the element "#left-box"
     Then "#event-log" should have text "The webship-ping event reached the left box"

  Scenario: Hover over an element
    Given I am on "/element-viewport.html"
     When I hover over the element "#hover-button"
     Then "#event-log" should have text "The pointer is over the hover button"

  Scenario: Scroll to an element below the fold
    Given I am on "/element-viewport.html"
     Then the element "#top-banner" should be displayed within a viewport
      And the element "#below-fold" should not be displayed within a viewport
     When I scroll to the element "#below-fold"
     Then the element "#below-fold" should be displayed within a viewport
      And the element "#top-banner" should not be displayed within a viewport

  Scenario: Element within the viewport with a top offset
    Given I am on "/element-viewport.html"
     Then the element "#centered-box" should be displayed within a viewport with a top offset of 60 pixels
      And the element "#top-banner" should not be displayed within a viewport with a top offset of 60 pixels
      And the element "#below-fold" should not be displayed within a viewport with a top offset of 60 pixels

  Scenario: Element at the top of the viewport
    Given I am on "/element-viewport.html"
     Then the element "#top-banner" should be at the top of the viewport
