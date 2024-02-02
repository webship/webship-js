Feature: An example of test assert for selecting a checkbox
  As an anonymous user
  I want to be sure that a specific checkbox should be checked before submitting a specific action.

  Scenario: Check that the checkbox should be checked
    Given I am on "/test--then--the-checkbox-checked.html"
    When I check "#PrivacyPolicy"
    And I press "Register"
    Then the checkbox "#PrivacyPolicy" should be checked
    And I should see "Registration Done Successfully"

  Scenario: Check that the checkbox should not be checked
    Given I am on "/test--then--the-checkbox-checked.html"
    When I press "Register"
    Then the "#PrivacyPolicy" checkbox should not be checked
    And I should see "Please check Agree to Privacy Policy"