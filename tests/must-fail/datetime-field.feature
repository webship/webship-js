@must-fail
Feature: Datetime steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint.

  Scenario: A datetime field that has no time input
    Fails with: The datetime field "Opening" has no time input.
    Given I am on "/datetime-fields.html"
    When I fill in the time part of the datetime field "Opening" with "09:00"
