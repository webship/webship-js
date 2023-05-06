Feature: Example test element contains Css property and property value expected
  As a developer
  I want to be able to test if element contains Css property and property value expected

  Scenario: Check element if contains Css property and property value expected
    Given I am on homepage
    When I go to "test--then--the-element-should_not-contain-cssproperty.html"
    Then the "body" element should contain "background-color: lightcoral;"
    And the "Username" element should contain "border: solid 5px red;"
    When I press "Submit"
    Then the "body" element should contain "background-color: white;"
    And the "Username" element should contain "border: solid 5px green;"