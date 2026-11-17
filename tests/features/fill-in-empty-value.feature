Feature: Fill in a field with an empty value
  As a tester,
  I want to fill a field with "" in every form of the fill step,
  so that a scenario can clear a field the way it fills one.

  Scenario: Fill a field with an empty value by its label
    Given I am on "/fill-in-empty.html"
     Then the field "title" should not be empty
     When I fill in "Title" with ""
     Then the field "title" should be empty

  Scenario: Fill in an empty value for a field by its label
    Given I am on "/fill-in-empty.html"
     Then the field "summary" should not be empty
     When I fill in "" for "Summary"
     Then the field "summary" should be empty

  Scenario: Fill a field with an empty value by its placeholder
    Given I am on "/fill-in-empty.html"
     When I fill in "Comma separated" with ""
     Then the field "keywords" should be empty

  Scenario: Fill a field with an empty value by attribute
    Given I am on "/fill-in-empty.html"
     When I fill in "#title" with "" by attr
      And I fill in "keywords-field" with "" by its "class" attribute
     Then the field "title" should be empty
      And the field "keywords" should be empty

  Scenario: Fill in an empty value for a field by attribute
    Given I am on "/fill-in-empty.html"
     When I fill in "" for "summary" by its "name" attribute
     Then the field "summary" should be empty

  Scenario: An empty cell of the fill table empties its field
    Given I am on "/fill-in-empty.html"
     When I fill in the following:
       | Title   |            |
       | Summary | New words  |
     Then the field "title" should be empty
      And the field "summary" should not be empty
