@must-fail
Feature: Top-of-the-viewport assertions that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint.

  Scenario: An element far below the top
    Fails with: The element "#section-5" is not at the top of the viewport after 5 seconds.
    Given I am on "/viewport-top.html"
    Then the element "#section-5" should be at the top of the viewport

  Scenario: An element that is hidden
    Fails with: The element "#hidden-section" is on the page but not visible after 5 seconds.
    Given I am on "/viewport-top.html"
    Then the element "#hidden-section" should be at the top of the viewport

  Scenario: An element that is not on the page
    Fails with: No element matches "#no-such-section" after 5 seconds.
    Given I am on "/viewport-top.html"
    Then the element "#no-such-section" should be at the top of the viewport
