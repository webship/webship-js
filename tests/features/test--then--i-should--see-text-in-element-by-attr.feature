Feature: An example to ensure that the input text contain a specific value based on its attribute
      As a tester,
      I want to ensure that the textbox contain a specific value based on its attributes.

  Scenario: Ensuring that a textbox contain a specific value based on its attributes.
    Given I am on "/test--then--i-should--not--see-text-in-element.html"
     When I fill in "Username" with "user1"
      And I fill in "Password" with "1234"
     Then I should see "user1" in the "uname" element by its "id" attr
      And I should see "1234" in the "pwordcss" element by attr