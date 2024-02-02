Feature: An example to test if the field contains certain value
  As a tester
  I want to be able to check field if has a certain value or not

  Scenario: Check field if has a particular value or not
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
    And I fill in "#uname" with "user1"
    Then the "#uname" field should contain "user1" 
    When I press "Reset"
    And I fill in "#uname" with "user2"
    Then the "#uname" field should not contain "user1"
