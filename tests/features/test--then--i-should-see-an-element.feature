Feature: An example to ensure that a specific element is visible on the current page by its label
  As a user, 
  I want to ensure that when I'm on a particular page, I can see a specific element by its label

  Scenario: Check to test seeing for a specific element by its label
    Given I am on "/test--then--i-should--see-text-in-element.html"
     Then I should see a "Username" element
      And I should see a "Password" element