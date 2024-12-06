Feature: An example of selecting an option in the dropdown list by its text label.

  As a tester,
  I want to be able to test selecting an option from a dropdown list by its text label.

  Scenario: Check selecting an option from a dropdown list by its text label.
    Given I am on "/test--when--i-select-option-from-dropdownlist.html"
    When I select "Saab" from "Choose a car:"
    When I press "Submit" by attr
    Then I should see "Option ( Saab ) has been selected successfully"