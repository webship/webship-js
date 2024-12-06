Feature: An example to verify whether the element contains a specific expected CSS property.
  As a developer, 
  I want to verify whether the element contains a specific expected CSS property.

  Scenario: Verify whether the element contains a specific expected CSS property
    Given I am on "/test--then--the-element-should_not-contain-cssproperty.html"
     Then I should see a "body" element by attr
     When I press "Submit"
     Then the "body" element should contain "background-color:white;"