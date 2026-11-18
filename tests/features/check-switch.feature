Feature: Toggle switches and custom checkboxes
  As a tester
  I want to check and uncheck a box the way a person does
  So that a slider drawn over the checkbox, or a box drawn by its label, does not stop the step

  Scenario: Check a switch whose slider covers its checkbox
    Given I am on "/check-switch.html"
    When I check "Analytics cookies"
    Then the checkbox "Analytics cookies" should be checked

  Scenario: Uncheck a switch that is on
    Given I am on "/check-switch.html"
    When I uncheck "Marketing cookies"
    Then the checkbox "Marketing cookies" should not be checked

  Scenario: Check and uncheck a switch named by its checkbox
    Given I am on "/check-switch.html"
    When I check the checkbox "#analytics"
    Then the checkbox "#analytics" should be checked
    When I uncheck the checkbox "#analytics"
    Then the checkbox "#analytics" should not be checked

  Scenario: Check a checkbox whose input is hidden and whose label draws the box
    Given I am on "/check-switch.html"
    When I check "Remember this device"
    Then the checkbox "Remember this device" should be checked
    When I uncheck "Remember this device"
    Then the checkbox "Remember this device" should not be checked
