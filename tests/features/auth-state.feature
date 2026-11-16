Feature: Save and restore the auth state
  As a tester,
  I want to save the cookies and the local storage of a signed-in visitor to a file and restore them later,
  so that a scenario starts signed in without going through the sign-in form.

  Scenario: Save the state of a signed-in visitor, then restore it
    Given I am on "/auth-state.html"
    Then "#auth-status" should have text "You are not signed in"
    When I press "Sign in"
    Then "#auth-status" should have text "Signed in as Webship Tester"
    When I save the auth state to "tests/auth/webship-tester.json"
    And I clear the auth state
    And I reload the page
    Then "#auth-status" should have text "You are not signed in"
    And a cookie with the name "webship_session" should not exist
    When I restore the auth state from "tests/auth/webship-tester.json"
    And I am on "/auth-state.html"
    Then "#auth-status" should have text "Signed in as Webship Tester"
    And a cookie with the name "webship_session" and the value "signed-in" should exist

  Scenario: The saved state carries cookies and local storage to another page
    Given I am on "/storage.html"
    And the cookie "webship_session" is set to "signed-in"
    And the local storage "webship_user" is set to "Webship Editor"
    When we save the auth state to "tests/auth/webship-editor.json"
    And we clear the auth state
    And we restore the auth state from "tests/auth/webship-editor.json"
    And I am on "/auth-state.html"
    Then "#auth-status" should have text "Signed in as Webship Editor"
    When I am on "/storage.html"
    Then "#cookies" should have text "webship_session = signed-in"
    And "#local-storage" should have text "webship_user = Webship Editor"
