Feature: An example to assert the selection of a checkbox
      As an anonymous user,
      I want to ensure that a specific checkbox is checked before submitting a particular action

  Scenario: Ensure that the checkbox is checked
    Given I am on "/test--then--the-checkbox-checked.html"
     When I check "PrivacyPolicy"
      And I press "Register" by attr
     Then the checkbox "#PrivacyPolicy" should be checked
      And I should see "Registration Done Successfully"

  Scenario: Ensure that the checkbox is not checked
    Given I am on "/test--then--the-checkbox-checked.html"
     When I press "Register" by attr
     Then the "#PrivacyPolicy" checkbox should not be checked
      And I should see "Please check Agree to Privacy Policy"