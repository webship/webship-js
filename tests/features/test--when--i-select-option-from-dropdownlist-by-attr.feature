Feature: An example to select option from dropdown list by its attributes

  As a tester
  I want to be able to test select option from dropdown list by its attributes

  Scenario: Check of selecting option from dropdown list by its attributes
    Given I am on "/test--when--i-select-option-from-dropdownlist.html"
     When I select "Saab" from "#cars" by attr
     When I press "Submit"
     Then I should see "Option ( Saab ) has been selected successfully"

  Scenario: Check of selecting option from drop down list
    Given I am on "/test--when--i-select-option-from-dropdownlist.html"
     When I select "Mercedes" from "cars" by its "id" attr
     When I press "Submit"
     Then I should see "Option ( Mercedes ) has been selected successfully"