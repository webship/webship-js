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
