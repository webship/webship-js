Feature: An example to uncheck the checkbox

  As a tester
  I want to be able to uncheck a checkbox

  Scenario: Uncheck the checkbox
    Given I am on "test--when--i-check-uncheck-checkbox.html"
    When I check "I have a bike"
    And I check "vehicle2"
    And I press "Submit"
    Then I should see "You have a Bike Car"
    When I uncheck "Bike"
    And I press "Submit"
    Then I should see "You have a Car"
    When I uncheck "Car"
    And I press "Submit"
    Then I should see "You have a"

