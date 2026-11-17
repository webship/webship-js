Feature: Checkboxes, radio buttons and fields named by their label, name or id
  As a tester,
  I want the checkbox, radio button and field steps to find a control the way the check steps do,
  so that a scenario names a control by what the form shows.

  Scenario: The state of a checkbox named by its label, its name or its id
    Given I am on "/choice-controls.html"
     Then the "Newsletter" checkbox should be checked
      And the "#opt-news" checkbox should be checked
      And the checkbox "terms" should not be checked
      And the "opt-terms" checkbox is not checked
      And the checkbox "Accept the terms" is not checked

  Scenario: Check and uncheck a checkbox named by its label or its name
    Given I am on "/choice-controls.html"
     When I check the checkbox "Accept the terms"
      And I uncheck the checkbox "newsletter"
     Then the checkbox "terms" is checked
      And the "Newsletter" checkbox should not be checked

  Scenario: The state of a radio button named by its label, its id or its value
    Given I am on "/choice-controls.html"
     Then the radio button "Premium" should be selected
      And the "plan-basic" radio button is not selected
      And the radio button "basic" should not be selected
     When I choose the radio button "Basic"
     Then the radio button "basic" should be selected
      And the "Premium" radio button is not selected

  Scenario: Fill a field named by its label or its name
    Given I am on "/choice-controls.html"
     When I fill in the field "City" with "Amman"
      And I fill in the field "nickname" with "Ali"
     Then "#city" should have value "Amman"
      And "#nick" should have value "Ali"
