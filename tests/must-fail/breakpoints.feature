@must-fail
Feature: Breakpoints that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one fails
  at its last step with the message its description announces, the address
  of the page and a hint.

  Scenario: A breakpoint nobody named
    Fails with: There is no breakpoint named "watch".
    Given I am on "/viewport-size.html"
     When I set the viewport to the "watch" breakpoint

  Scenario: A breakpoint nobody named, by the viewing-the-site step
    Fails with: There is no breakpoint named "phablet".
    Given I am on "/viewport-size.html"
     When I am viewing the site on a "phablet" screen
