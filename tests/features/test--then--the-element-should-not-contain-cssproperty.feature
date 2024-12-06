Feature: An example to verify whether the element does not contain a specific expected CSS property.
  As a developer, 
  I want to verify whether the element does not contain a specific expected CSS property.

  Scenario: Verify whether the element does not contain a certain CSS property
    Given I am on "/test--then--the-element-should_not-contain-cssproperty.html"
     Then I should see a "body" element by attr
     When I press "Submit"
     Then the "#uname" element should not contain "border:solid 5px red;"
     And the "pword" element should not contain "font-size: 28px;"