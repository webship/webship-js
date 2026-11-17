@must-fail
Feature: Clock steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one fails
  at its last step with the message its description announces, the address
  of the page and a hint.

  Scenario: Waiting for the timers of the page under a fake clock
    Fails with: A fake clock is installed, so the timers of the page run only when the clock moves.
    Given I am on "/clock.html"
      And the system time is "2026-05-08T10:00:00Z"
     When I wait until pending timers settle
