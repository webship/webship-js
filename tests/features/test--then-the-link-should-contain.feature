Feature: An example of checking the href attribute of a link element to see if it contains a specific text.

  As a tester, 
  I want to be able to check link href if contain a specific text

  Scenario: Verify that the link contains "about"
    Given I am on "/test--then--the-link-should-contain.html"
      Then the "About us" link should contain "about"