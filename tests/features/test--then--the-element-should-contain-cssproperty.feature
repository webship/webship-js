Feature: An example to test if the element contains a certain expected CSS property.
  As a developer
  I want to be able to test if the element contains a certain expected CSS property.

  Scenario: Check element if the element contains a certain expected CSS property
    Given I am on "/test--then--the-element-should_not-contain-cssproperty.html"
    Then I should see a "body" element by attr
    When I press "Submit"
    Then the "body" element should contain "background-color:white;" css style