Feature: Example test for: Then I should see "text" in the "element" element
  As a developer
  I want to be able to check an element if it has a particular text or not

  Scenario: Check an element if it has a particular text or not
    Given I am on homepage
    When I go to "test--then--i-should--not--see-text-in-element.html"
    And I fill in "Username" with "user1"
    And I fill in "Password" with "1234"
    Then I should see "user1" in the "Username" element
    When I press "Reset"
    And I fill in "Username" with "user2"
    Then I should not see "user1" in the "Username" element
