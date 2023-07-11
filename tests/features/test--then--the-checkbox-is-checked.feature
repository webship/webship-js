Feature: An example of test for selecting a checkbox
  As a tester
  I want to be able to check that the checkbox is checked or not

  Scenario: Check that the checkbox is checked
    Given I am on "/test--then--the-checkbox-checked.html"
    When I check "rememberMe"
    And I check "PrivacyPolicy"
    And I press "Register"
    Then the checkbox "Remember me" is checked
    And I should see "Registration Done Successfully"

  Scenario: Check that the checkbox is not checked
    Given I am on "/test--then--the-checkbox-checked.html"
    When I check "PrivacyPolicy"
    And I press "Register"
    Then the checkbox "Remember me" is not checked
    Then I should see "Registration Done Successfully"