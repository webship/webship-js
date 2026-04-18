Feature: Debug helpers — print current URL and last response HTML
  As a tester,
  I want to dump the current URL and page HTML to the console
  so that I can diagnose failures without attaching a debugger.

  Scenario: Print current URL
    Given I am on homepage
     Then print current URL

  Scenario: Print last response HTML
    Given I am on homepage
     Then print last response

  Scenario: Print both in the same scenario
    Given I am on homepage
     Then print current URL
      And print last response

  Scenario: Print current URL after navigating
    Given I am on "/about-us.html"
     Then print current URL
