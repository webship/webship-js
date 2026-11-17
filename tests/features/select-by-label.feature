Feature: Select an option from a select list named by its label, name or id
  As a tester,
  I want to name a select list by the text of its label, whatever its length,
  so that a scenario reads the way the form reads.

  Scenario: A select list named by a one-word label
    Given I am on "/select-by-label.html"
     When I select "Saab" from "Cars"
     Then the option "Saab" should be selected within the select element "#vehicle-list"

  Scenario: An option named by its value, in a select list named by its label
    Given I am on "/select-by-label.html"
     When I select "mercedes" from "Cars"
     Then the option "Mercedes" should be selected within the select element "#vehicle-list"

  Scenario: A select list named by a name with brackets
    Given I am on "/select-by-label.html"
     When I select "Red" from "filters[colour]"
     Then the option "Red" should be selected within the select element "#filters-colour"

  Scenario: A select list named by its id
    Given I am on "/select-by-label.html"
     When I select "Volvo" from "vehicle-list"
     Then the option "Volvo" should be selected within the select element "#vehicle-list"

  Scenario: A select list named by its label, next to another one
    Given I am on "/select-by-label.html"
     When I select "Blue" from "Colour"
      And I select "Saab" from "Cars"
     Then the option "Blue" should be selected within the select element "#filters-colour"
      And the option "Saab" should be selected within the select element "#vehicle-list"
