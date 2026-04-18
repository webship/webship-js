Feature: Add an option to a multi-select without clearing existing selection
  As a tester,
  I want to build up a multi-select selection across multiple steps
  so that I can test <select multiple> workflows one option at a time.

  Scenario: Add two colors to an empty Colors multi-select
    Given I am on "/test--when--i-additionally-select.html"
     When I additionally select "Red" from "Colors"
      And I additionally select "Blue" from "Colors"

  Scenario: Start with one, then add two more
    Given I am on "/test--when--i-additionally-select.html"
     When I select "Red" from "Colors"
      And I additionally select "Blue" from "Colors"
      And I additionally select "Green" from "Colors"

  Scenario: Pronoun variant — "we"
    Given I am on "/test--when--i-additionally-select.html"
     When we additionally select "Red" from "Colors"
      And we additionally select "Yellow" from "Colors"

  Scenario: No pronoun
    Given I am on "/test--when--i-additionally-select.html"
     When additionally select "Admin" from "Roles"
      And additionally select "Editor" from "Roles"

  Scenario: Multi-select on a second select on the same page
    Given I am on "/test--when--i-additionally-select.html"
     When I additionally select "Admin" from "Roles"
      And I additionally select "Viewer" from "Roles"
