Feature: Example test for: Then the "filed" should contain "value"
  As a tester
  I want to be able to check field if has a particular value or not

  Scenario: Check field if has a particular value or not
    Given I am on homepage
    When I go to "test--then--i-should--not--see-text-in-element.html"
    And I fill in "Username" with "user1"
    Then the "Username" field should contain "user1" 
    When I press "Reset"
    And I fill in "Username" with "user2"
    Then the "Username" field should not contain "user1"
