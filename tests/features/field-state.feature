Feature: The state of a field
  As a tester,
  I want to check that a field is enabled, disabled, editable or read-only,
  so that a form shows the right fields as locked.

  Scenario: An enabled field that can be edited
    Given I am on "/field-states.html"
     Then the field "Username" should have "enabled" state
      And the field "Username" should have "editable" state

  Scenario: A disabled field
    Given I am on "/field-states.html"
     Then the field "Account ID" should have "disabled" state
      And the field "account_id" should have "disabled" state

  Scenario: A read-only field is enabled but cannot be edited
    Given I am on "/field-states.html"
     Then the field "Reference" should have "read-only" state
      And the field "Reference" should have "readonly" state
      And the field "Reference" should have "enabled" state
      And the field "Notes" should have "read-only" state
