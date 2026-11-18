@must-fail
Feature: The homepage assertion must fail on another page, and on the homepage in its negative form
  The homepage is launchUrl (or the address it redirects to). Another page of
  the site is not the homepage. tests/check-must-fail.js checks the message,
  the page and the hint.

  Scenario: Another page of the site is not the homepage
    Fails with: Expected to be on the homepage, but the page is another one.
    Given I am on "/about-us.html"
    Then I should be on the homepage

  Scenario: The homepage is the homepage
    Fails with: Expected not to be on the homepage, but the page is the homepage.
    Given I am on the homepage
    Then I should not be on the homepage
