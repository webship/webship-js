Feature: An example to test if the element does not contain a certain expected CSS property.
  As a developer
  I want to be able to test if the element does not contain a certain expected CSS property.

  Scenario: Check element if the element not contain a certain CSS property
    Given I am on "/test--then--the-element-should_not-contain-cssproperty.html"
    Then I should see a "body" element by attr
    When I press "Submit"
    Then the "#uname" element should not contain "border:solid 5px red;"
    And the "pword" element should not contain "font-size: 28px;"