Feature: A field whose label a hidden dialog repeats
  As a tester,
  I want a step to use the one field a person sees when the page keeps closed dialogs with copies of its fields,
  so that a label names that field, as it does for a person.

  Scenario: Fill, select, check and choose the visible field, never its hidden copies
    Given I am on "/fields-in-hidden-dialogs.html"
     When I fill in "Friendly Name" with "Shop"
     Then "#name" should have value "Shop"
      And "#clone-name" should have value ""
      And "#group-name" should have value ""
     When I select "Push" from "Monitor Type"
     Then "#type" should have value "push"
      And "#clone-type" should have value "http"
     When I check "Upside Down Mode"
     Then the checkbox "#upside" should be checked
      And the "#clone-upside" checkbox should not be checked
     When I uncheck "Upside Down Mode"
     Then the "#upside" checkbox should not be checked
     When I select radio button "GET request"
     Then the radio button with value "get-method" should be selected
