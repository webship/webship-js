Feature: JavaScript errors a scenario tolerates
  As a tester,
  I want to tolerate the errors of a noisy page while one pattern must never appear,
  so that a run in "fail" mode fails only on what the scenario does not accept.

  # "@js-fail" fails a scenario on any JavaScript error it does not handle.
  # "JavaScript errors should not match" handles the errors it checked.
  @js-fail
  Scenario: Errors that do not match the pattern do not fail the scenario
    Given I am on "/javascript-errors.html"
     When I press "Throw an error"
     Then I should see "An error was thrown"
      And JavaScript errors should not match "TypeError"

  @js-fail
  Scenario: A logged error that does not match the pattern does not fail the scenario
    Given I am on "/javascript-errors.html"
     When I press "Log an error"
     Then I should see "An error was logged"
      And JavaScript errors should not match "is not defined"
