@must-fail
Feature: Field state checks that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint.

  Scenario: An editable field is not read-only
    Fails with: The field "Username" is not read-only.
    Given I am on "/field-states.html"
    Then the field "Username" should have "read-only" state

  Scenario: A disabled field is not editable
    Fails with: The field "Account ID" is not editable.
    Given I am on "/field-states.html"
    Then the field "Account ID" should have "editable" state

  Scenario: A state the step does not know
    Fails with: "valid" is not a state this step can check.
    Given I am on "/field-states.html"
    Then the field "Username" should have "valid" state
