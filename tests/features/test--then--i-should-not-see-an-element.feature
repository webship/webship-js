Feature: An example to ensure that a specific element is not visible on the current page by its label
      As a user,
      I want to ensure that when I'm on a particular page, I do not see a specific element by its label

  Scenario: Ensure to test that a specific element is not visible by its label
    Given I am on "/test--then--i-should--see-text-in-element.html"
     Then I should not see an "Eamil" element
      And I should not see a "Country" element