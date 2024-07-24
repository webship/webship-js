Feature: An example to test whether the input text does not contain a specific value by its attribute
  As a tester
  I want to be able to check an input text does not contain a specific value by its attribute
  Scenario: Check an element if it does not contain a specific text
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
     When I fill in "Username" with "user1"
      And I fill in "Password" with "1234"
     Then I should see "user1" in the "Username" element
     When I fill in "uname" with: by attr
      And I fill in "Password" with:
     Then I should not see "user1" in the "Username" element
     Then I should not see "1234" in the "pword" element by attr