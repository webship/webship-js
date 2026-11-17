@must-fail
Feature: Storage steps before the first page, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one fails
  at its last step with the message its description announces, the address of
  the page and a hint.

  Scenario: Local storage set before a page of the site is open
    Fails with: Could not set the local storage "theme": the page has no site yet.
    Given the local storage "theme" is set to "dark"

  Scenario: Session storage cleared before a page of the site is open
    Fails with: Could not clear the session storage: the page has no site yet.
    Given session storage is cleared
