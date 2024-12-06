Feature: An example to verify whether the field contains a specific value identified by its element label
  As a tester, 
  I want to verify whether the field has a specific value based on its element label

  Scenario: Verify that the field has a particular value based on its element label
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
      And I fill in "Username" with "user1"
     Then the "Username" field should contain "user1" 
     When I press "Reset" by attr
      And I fill in "Username" with "user2"
     Then the "Username" field should contain "user2"
