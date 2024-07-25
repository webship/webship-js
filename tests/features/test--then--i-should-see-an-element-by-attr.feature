Feature: An example to test seeing for a specific element on current page by its attributes
  As a user
  I want to make sure that when I'm on a particular page, I should see a specific element by its attributes

  Scenario: Check to test seeing for a specific element by its attributes
    Given I am on "/test--then--i-should--see-text-in-element.html"
     Then I should see a "uname" element by its "id" attr
      And I should see a "pwordcss" element by attr