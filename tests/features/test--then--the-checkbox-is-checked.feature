Feature: An example of a test case for selecting a checkbox
      As a tester,
      I want to be able to check that the checkbox is checked or not

  Scenario: Verify that the checkbox is checked
    Given I am on "/test--then--the-checkbox-checked.html"
     When I check "rememberMe"
      And I check "PrivacyPolicy"
      And I press "Register" by attr
     Then the checkbox "#rememberMe" is checked
      And I should see "Registration Done Successfully"

  Scenario: Verify that the checkbox is not checked
    Given I am on "/test--then--the-checkbox-checked.html"
     When I check "PrivacyPolicy"
      And I press "Register" by attr
     Then the checkbox "#rememberMe" is not checked
     Then I should see "Registration Done Successfully"