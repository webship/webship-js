Feature: Example test for "When I check 'item'"

  As a tester
  I want to be able to test check a checkbox item

  Scenario: Check the "When I check 'item'" step definitions
    Given I am on "test--when--i-check-uncheck-checkbox.html"
    When I check "vehicle1"
    And I press "Submit"
    Then I should see "You have a Bike"
    When I check "Car"
    And I press "Submit"
    Then I should see "You have a Bike Car"
    When I check "I have a boat"
    And I press "Submit"
    Then I should see "You have a Bike Car Boat"

