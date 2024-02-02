Feature: An example to uncheck the checkbox

  As a tester
  I want to be able to uncheck a checkbox

  Scenario: Uncheck the checkbox
    Given I am on "/test--when--i-check-uncheck-checkbox.html"
    When I check "#bike"
    And I check "#car"
    And I press "Submit"
    Then I should see "You have a Bike Car"
    When I check ".van"
    Then I should see "You have a Bike Car Van"
    When I uncheck "#bike"
    And I press "Submit"
    Then I should see "You have a Car Van"
    When I uncheck "#car"
    When I uncheck "#van"
    And I press "Submit"
    Then I should see "You have a"

