Feature: An example to test if the field contains certain value by element label
  As a tester
  I want to be able to check field if has a certain value by element label

  Scenario: Check field if has a particular value by element label
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
    And I fill in "Username" with "user1"
    Then the "Username" field should contain "user1" 
    When I press "Reset" by attr
    And I fill in "Username" with "user2"
    Then the "Username" field should contain "user2"
