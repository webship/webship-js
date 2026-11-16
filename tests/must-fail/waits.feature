@must-fail
Feature: Waits that must fail, and what they say
  Every scenario waits for something that never happens on the example pages.
  tests/check-must-fail.js runs them and checks that each one fails at its
  last step with the message its description announces, the address of the
  page and a hint.

  Scenario: A text that never arrives
    Fails with: The text "Never arrives" did not appear within 10 seconds.
    Given I am on "/about-us.html"
    When I wait for the text "Never arrives" to appear

  Scenario: A text that never leaves
    Fails with: The text "Paragraph example" is still on the page after 10 seconds.
    Given I am on "/about-us.html"
    When I wait for the text "Paragraph example" to disappear

  Scenario: An element that never appears
    Fails with: The element "#no-such-element-here" did not appear within 10 seconds.
    Given I am on "/about-us.html"
    When I wait for "#no-such-element-here" to appear

  Scenario: An element that never disappears
    Fails with: The element "#paragraphid" is still visible after 10 seconds.
    Given I am on "/about-us.html"
    When I wait for "#paragraphid" to disappear

  Scenario: A URL that never comes
    Fails with: The URL does not contain "/dashboard" after 10 seconds.
    Given I am on "/about-us.html"
    When I wait until the URL contains "/dashboard"

  Scenario: A page title that never comes
    Fails with: The page title is not "Dashboard" after 10 seconds.
    Given I am on "/about-us.html"
    When I wait until the page title is "Dashboard"

  Scenario: A number of elements that is never reached
    Fails with: Expected 7 element(s) matching "#users tbody tr" within 10 seconds.
    Given I am on "/table.html"
    When I wait until 7 elements match "#users tbody tr"

  Scenario: A minimum number of elements that is never reached
    Fails with: Expected at least 7 element(s) matching "#users tbody tr" within 10 seconds.
    Given I am on "/table.html"
    When I wait until at least 7 elements match "#users tbody tr"

  Scenario: A text that does not show up in time
    Fails with: The text "Never arrives" did not appear within 2 seconds.
    Given I am on "/about-us.html"
    Then eventually I should see "Never arrives" within 2 seconds
