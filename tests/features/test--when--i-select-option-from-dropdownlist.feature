Feature: An example to select option from drop down list

  As a tester
  I want to be able to test select option from drop down list

  Scenario: Check of selecting option from drop down list
    Given I am on "/test--when--i-select-option-from-dropdownlist.html"
    When I select "saab" from "cars"
    When I press "Check select"
    Then I should see "Option ( Saab ) has been selected successfully"


