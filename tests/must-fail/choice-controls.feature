@must-fail
Feature: Checkbox, radio button and field steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint, within a few seconds.

  Scenario: A checkbox that is not on the page
    Fails with: No checkbox with the label, the name, the id or the selector "Subscribe" was found after 5 seconds.
    Given I am on "/choice-controls.html"
    Then the "Subscribe" checkbox should be checked

  Scenario: A checkbox that is not checked
    Fails with: The checkbox "Accept the terms" is not checked.
    Given I am on "/choice-controls.html"
    Then the checkbox "Accept the terms" should be checked

  Scenario: A radio button that is selected
    Fails with: The radio button "Premium" is selected, but it should not be.
    Given I am on "/choice-controls.html"
    Then the radio button "Premium" should not be selected

  Scenario: A field that is not on the page
    Fails with: No field with the label, the name, the id or the selector "Country" was found after 5 seconds.
    Given I am on "/choice-controls.html"
    When I fill in the field "Country" with "Jordan"
