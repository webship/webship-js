Feature: Field step definitions

  Scenario: Field state assertions
    Given I am on "/field.html"
     Then the field "username" should exist
      And the field "username" should be empty
      And the field "username" should be required
      And the field "bio" should not be required
      And the field "missing-field" should not exist
      And the option "Admin" should exist within the select element "#role"
      And the option "Manager" should not exist within the select element "#role"
      And the option "Admin" should not be selected within the select element "#role"

  Scenario: Field interactions
    Given I am on "/field.html"
     When I fill in the field "#username" with "alice"
      And I check the checkbox "#agree"
      And I choose the radio button "#r-red"
      And I fill in the color field "fav" with the value "#ff0000"
     Then the field "username" should not be empty
      And the color field "fav" should have the value "#ff0000"

  Scenario: Disable browser validation
    Given I am on "/field.html"
      And browser validation for the form "#f" is disabled

  Scenario: Enabled and disabled state of a field
    Given I am on "/field-types.html"
     Then the field "Account ID" should have "disabled" state
      And the field "account_id" should have "disabled" state
      And the field "Display name" should have "enabled" state
      And the field "#display-name" should have "enabled" state

  Scenario: Fill a multi-value field
    Given I am on "/field-types.html"
     When I fill in the multi-value field "tags" with the following values:
        | bdd     |
        | testing |
        | webship |
      And we fill in the multi-value field "phones" with the following values:
        | 0790000000 |
        | 0791111111 |
     Then "#tags-1" should have value "bdd"
      And "#tags-2" should have value "testing"
      And "#tags-3" should have value "webship"
      And "#phones-1" should have value "0790000000"
      And "#phones-2" should have value "0791111111"

  Scenario: Fill a rich-text field
    Given I am on "/field-types.html"
     When I fill in the WYSIWYG field "body" with the "Hello from the editor"
     Then "#body-editor" should contain text "Hello from the editor"
      And "#body-editor p" should have text "Hello from the editor"
      And "#body" should have value "Hello from the editor"

  Scenario: Fill one rich-text field of several
    Given I am on "/field-types.html"
     When I fill in the WYSIWYG field "summary" with the "Short summary"
     Then "#summary-editor p" should have text "Short summary"
      And "#summary" should have value "Short summary"
      And "#body-editor" should have text ""
     When I fill in the WYSIWYG field "Body" with the "Long body"
     Then "#body-editor p" should have text "Long body"
      And "#summary-editor p" should have text "Short summary"
     When we fill in the WYSIWYG field "Summary" with the "Found by its label"
     Then "#summary-editor p" should have text "Found by its label"
      And "#body-editor p" should have text "Long body"

  Scenario: Selected options of a select with several values
    Given I am on "/field-types.html"
     Then the option "Red" should be selected within the select element "#colors"
      And the option "Blue" should be selected within the select element "#colors"
      And the option "Green" should not be selected within the select element "#colors"
     When I unselect "Red" from "#colors"
     Then the option "Red" should not be selected within the select element "#colors"
      And the option "Blue" should be selected within the select element "#colors"
      And "#colors-summary" should have text "Selected: Blue"
     When I clear the select "#colors"
     Then the option "Blue" should not be selected within the select element "#colors"
      And "#colors-summary" should have text "Selected: none"

  Scenario: Uncheck a checkbox by its selector
    Given I am on "/field-types.html"
     Then the "#newsletter" checkbox is checked
      And "#terms" checkbox is not checked
     When I uncheck the checkbox "#newsletter"
     Then the "#newsletter" checkbox is not checked

  Scenario: Fill the date and the time of a datetime field
    Given I am on "/field-types.html"
     When I fill in the datetime field "Reminder" with date "2026-09-15" and time "14:00"
     Then "#reminder-date" should have value "2026-09-15"
      And "#reminder-time" should have value "14:00"
      And "#pickup-date" should have value ""

  Scenario: Fill one part of a datetime field
    Given I am on "/field-types.html"
     When I fill in the date part of the datetime field "Pickup" with "2026-07-04"
     Then "#pickup-date" should have value "2026-07-04"
      And "#pickup-time" should have value ""
     When I fill in the time part of the datetime field "Pickup" with "08:30"
     Then "#pickup-time" should have value "08:30"
      And "#reminder-date" should have value ""

  Scenario: Fill the start and the end of a date range
    Given I am on "/field-types.html"
     When I fill in the start datetime field "event" with date "2026-05-08" and time "10:00"
      And I fill in the end datetime field "event" with date "2026-05-09" and time "18:00"
     Then "#event-start-date" should have value "2026-05-08"
      And "#event-start-time" should have value "10:00"
      And "#event-end-date" should have value "2026-05-09"
      And "#event-end-time" should have value "18:00"

  Scenario: Datetime inputs right after their label, and a range named by its legend
    Given I am on "/field-types.html"
     When I fill in the datetime field "Departure" with date "2026-12-31" and time "23:59"
     Then "#departure-date" should have value "2026-12-31"
      And "#departure-time" should have value "23:59"
     When I fill in the date part of the datetime field "Departure" with "2027-01-01"
      And I fill in the time part of the datetime field "Departure" with "06:15"
     Then "#departure-date" should have value "2027-01-01"
      And "#departure-time" should have value "06:15"
     When I fill in the start datetime field "Event" with date "2026-05-08" and time "10:00"
      And we fill in the end datetime field "Event" with date "2026-05-09" and time "18:00"
     Then "#event-start-date" should have value "2026-05-08"
      And "#event-start-time" should have value "10:00"
      And "#event-end-date" should have value "2026-05-09"
      And "#event-end-time" should have value "18:00"
      And "#reminder-date" should have value ""
