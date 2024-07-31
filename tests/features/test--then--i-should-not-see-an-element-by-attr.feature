Feature: An example to test not seeing for a specific element on current page by its label
  As a user
  I want to make sure that when I'm on a particular page, I should not see a specific element by its label

  Scenario: Check to test not seeing for a specific element by its label
    Given I am on "/test--then--i-should--see-text-in-element.html"
     Then I should not see an "emailId" element by its "id" attr
      And I should not see a "countryCss" element by attr