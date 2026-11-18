@must-fail
Feature: Select steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint, within a few seconds.

  Scenario: A select list that is not on the page
    Fails with: No select list with the label, the name or the id "Bikes" was found after 5 seconds.
    Given I am on "/select-by-label.html"
    When I select "Saab" from "Bikes"

  Scenario: An option that is not in the select list
    Fails with: The select list "Cars" has no option "Tesla".
    Given I am on "/select-by-label.html"
    When I select "Tesla" from "Cars"

  Scenario: An option of a select list that is hidden
    Fails with: the element is hidden or off-screen
    Given I am on "/multi-value-fields.html"
    When I select "0" from "field_topics[0][_weight]"
