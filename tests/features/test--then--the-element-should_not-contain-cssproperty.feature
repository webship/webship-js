Feature: An example to test if the element contains a certain expected CSS property or not.
  As a developer
  I want to be able to test if the element contains a certain expected CSS property or not.

  Scenario: Check element if the element contains a certain expected CSS property
    Given I am on homepage
    When I go to "test--then--the-element-should_not-contain-cssproperty.html"
    Then I should see a "body" element
    When I press "Submit"
    Then the "body" element should contain "background-color: white;"

    Scenario: Check element if the element not contains a certain CSS property
    Given I am on homepage
    When I go to "test--then--the-element-should_not-contain-cssproperty.html"
    Then I should see a "body" element
    When I press "Submit"
    Then the "Username" element should not contain "border: solid 5px red;"