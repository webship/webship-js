Feature: Fill a field that can be filled, next to fields that cannot
  As a tester,
  I want the fill steps to fill a visible, enabled field as before,
  so that the plain messages for the other fields change nothing else.

  Scenario: Fill a visible field by its label, its placeholder and by attribute
    Given I am on "/fill-unreachable.html"
     When I fill in "Your name" with "Alice"
     Then "#visible-name" should have value "Alice"
     When I fill in "Full name" with "Bob"
     Then "#visible-name" should have value "Bob"
     When I fill in "visible_name" with "Carol" by its "name" attribute
     Then "#visible-name" should have value "Carol"
