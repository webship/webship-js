Feature: An example of checking the href attribute of a link element to see if it contains a specific URL, which is found by its attributes.

  As a tester, 
  I want to be able to check link href if contain a specific URL found by its attributes

  Scenario: Verify that the link contains "about" by its attribute
    Given I am on "/test--then--the-link-should-contain.html"
      Then the "#aboutUsid" link should contain "about" by attr
      And the "aboutUs" link should contain "about" by its "class" attribute

  Scenario: Verify that the link contains "contact-" by its attribute
    Given I am on "/test--then--the-link-should-contain.html"
      Then the "contactUsid" link should contain "/contact-" by its "id" attribute
      And the ".contactUs" link should contain "/contact-" by attr