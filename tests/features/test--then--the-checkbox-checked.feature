Feature: Example test the checkbox if checked or not
  As a tester
  I want to be able to test uncheck a checkbox item

  Scenario: Check the "Then checkbox is/should be checked" step definitions
    Given I am on "test--then--the-checkbox-checked.html"
    When I press "Register"
    Then the "PrivacyPolicy" checkbox should not be checked
    And the "rememberMe" checkbox is not checked
    And I should see "Please check Agree to Privacy Policy"
    When I check "PrivacyPolicy"
    And I press "Register"
    Then the checkbox "PrivacyPolicy" should be checked
    And I should see "Registration Done Successfully"
    When I check "rememberMe"
    Then the checkbox "Remember me" is checked
