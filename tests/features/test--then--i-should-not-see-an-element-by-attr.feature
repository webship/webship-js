Feature: An example to ensure that a specific element is not visible on the current page by its attribute
      As a user,
      I want to ensure that when I'm on a particular page, I do not see a specific element identified by its attribute

  Scenario: Ensure that a specific element is not visible based on its attribute
    Given I am on "/test--then--i-should--see-text-in-element.html"
     Then I should not see an "emailId" element by its "id" attr
      And I should not see a "countryCss" element by attr