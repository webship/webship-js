Feature: JavaScript errors of the page
  As a tester,
  I want to know when the page throws or logs an error,
  so that a broken script does not hide behind a page that still looks right.

  Scenario: A quiet page has no JavaScript errors and no warnings
    Given I am on "/javascript-errors.html"
     Then I should see "Nothing has happened yet"
      And there should be no JavaScript errors
      And there should be no JavaScript warnings
      And JavaScript errors should not match "Demo"
      And print JavaScript errors

  Scenario: A warning is not an error
    Given I am on "/javascript-errors.html"
     When I press "Log a warning"
     Then I should see "A warning was logged"
      And there should be no JavaScript errors

  # The page throws on purpose here. "@js-warn" keeps this scenario in the
  # reporting mode whatever WEBSHIP_JS_ERROR_MODE the run uses, so a run in
  # "fail" mode does not fail on the error this scenario asks for.
  @js-warn
  Scenario: An error the page throws is collected and can be matched
    Given I am on "/javascript-errors.html"
     When I press "Throw an error"
     Then I should see "An error was thrown"
      And JavaScript errors should not match "TypeError"
      And JavaScript errors should not match "is not defined"
      And print JavaScript errors

  @js-warn
  Scenario: An error the page logs is collected and can be matched
    Given I am on "/javascript-errors.html"
     When I press "Log an error"
     Then I should see "An error was logged"
      And JavaScript errors should not match "^Demo failure"
      And print JavaScript errors

  # With "@js-off" nothing is collected, so the hard check passes even on a
  # page that throws.
  @js-off
  Scenario: Nothing is collected when the collector is off
    Given I am on "/javascript-errors.html"
     When I press "Throw an error"
     Then I should see "An error was thrown"
      And there should be no JavaScript errors
