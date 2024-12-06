Feature: An example of selecting an option from a dropdown list using its attributes.

  As a tester,
  I want to be able to test selecting an option from a dropdown list using its attributes.

  Scenario: Check selecting an option from a dropdown list using its attributes.
    Given I am on "/test--when--i-select-option-from-dropdownlist.html"
     When I select "Saab" from "#cars" by attr
     When I press "Submit"
     Then I should see "Option ( Saab ) has been selected successfully"

  Scenario: Check selecting an option from a dropdown list.
    Given I am on "/test--when--i-select-option-from-dropdownlist.html"
     When I select "Mercedes" from "cars" by its "id" attr
     When I press "Submit"
     Then I should see "Option ( Mercedes ) has been selected successfully"