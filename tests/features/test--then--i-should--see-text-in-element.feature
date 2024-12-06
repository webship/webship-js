Feature: An example to ensure that the input text contain a specific value based on its label
  As a tester, 
  I want to ensure thlabelat the textbox does not contain a specific value based on its label

  Scenario: Ensuring that a textbox does not contain a specific value based on its label.
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
     When I fill in "Username" with "user1"
      And I fill in "Password" with "1234"
     Then I should see "user1" in the "Username" element
      And I should see "1234" in the "Password" element