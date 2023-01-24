Feature: Example test for "When I select option from select list"

  As a tester
  I want to be able to test select option from selectbox

  Scenario: Check the "When I select 'option' from 'select list'" step definitions
    Given I am on homepage
    When I go to "test--when--i-select-option-from-selectbox.html"
    When I select "saab" from "cars"
    When I press "Check select"
    Then I should see "Option ( Saab ) has been selected successfully"


