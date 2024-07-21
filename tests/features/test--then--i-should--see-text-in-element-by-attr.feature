Feature: An example to test whether an element contains a certain text or not
  As a tester
  I want to be able to check an element contains a certain text or not

  Scenario: Check an element if it contains a specific text
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
    When I fill in "Username" with "user1"
    And I fill in "Password" with "1234"
    Then I should see "user1" in the "uname" element by its "id" attr
    And I should see "1234" in the "pwordcss" element by attr