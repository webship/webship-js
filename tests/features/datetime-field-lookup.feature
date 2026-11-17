Feature: Find the inputs of a datetime field by its own label
  As a tester,
  I want a datetime step to fill the inputs of the field it names and no other,
  so that a form with several date fields is filled in the right places.

  Scenario: A label that contains the text of another one is not taken for it
    Given I am on "/datetime-fields.html"
     When I fill in the date part of the datetime field "Start" with "2026-05-08"
     Then "#start-date" should have value "2026-05-08"
      And "#restart-date" should have value ""

  Scenario: Two fields in one paragraph
    Given I am on "/datetime-fields.html"
     When I fill in the datetime field "Closing" with date "2026-06-30" and time "18:00"
      And I fill in the date part of the datetime field "Opening" with "2026-06-01"
     Then "#closing-date" should have value "2026-06-30"
      And "#closing-time" should have value "18:00"
      And "#opening-date" should have value "2026-06-01"

  Scenario: A label alone in its wrapper
    Given I am on "/datetime-fields.html"
     When I fill in the datetime field "Arrival" with date "2026-07-04" and time "08:30"
     Then "#arrival-date" should have value "2026-07-04"
      And "#arrival-time" should have value "08:30"
      And "#leaving-date" should have value ""
      And "#leaving-time" should have value ""
     When I fill in the time part of the datetime field "Leaving" with "20:15"
     Then "#leaving-time" should have value "20:15"
      And "#arrival-time" should have value "08:30"
