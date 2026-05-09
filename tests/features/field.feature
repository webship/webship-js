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
