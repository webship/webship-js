Feature: Example test for "When I uncheck 'item'"

  As a tester
  I want to be able to test uncheck a checkbox item

  Scenario: Check the "When I uncheck 'item'" step definitions
    Given I am on "test--when--i-check-uncheck-checkbox.html"
    When I check "I have a bike"
    And I press "Submit"
    Then I should see "You have a Bike"
    When I check "vehicle2"
    And I press "Submit"
    Then I should see "You have a Bike Car"
    When I uncheck "Bike"
    And I press "Submit"
    Then I should see "You have a Car"
    When I uncheck "Car"
    And I press "Submit"
    Then I should see "You have a"

