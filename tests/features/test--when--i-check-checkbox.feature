Feature: An example of checking and unchecking a checkbox

  As a tester, 
  I want to be able to check and uncheck a checkbox

  Scenario: Implementing the ability to check and uncheck a checkbox
    Given I am on "/test--when--i-check-uncheck-checkbox.html"
     When I check "bike"
      And I check "car"
      And I press "Submit" by "value" attr
     Then I should see "You have a Bike Car"
     When I check "van"
      And I press "Submit" by "value" attr
     Then I should see "You have a Bike Car Van"
     When I uncheck "bike"
      And I press "Submit" by "value" attr
     Then I should see "You have a Car Van"
     When I uncheck "car"
     When I uncheck "van"
      And I press "Submit" by "value" attr
     Then I should see "You have a"

