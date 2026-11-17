@must-fail
Feature: Selector files that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one fails
  at its last step with the message its description announces, the address of
  the page and a hint.

  Scenario: A selector file that is not there
    Fails with: The selector file "no-such-selectors.json" was not found.
    Given I am on homepage
     When I add selectors from "no-such-selectors.json" file
