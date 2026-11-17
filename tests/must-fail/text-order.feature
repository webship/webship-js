@must-fail
Feature: Text-order assertions that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint.

  Scenario: The first places on the whole page are in the other order
    Fails with: The text "Products" does not appear after the text "Home" on the page.
    Given I am on "/text-order.html"
    Then the text "Products" should appear after the text "Home"

  Scenario: A text that is not on the page
    Fails with: The text "Desktops" is not on the page.
    Given I am on "/text-order.html"
    Then the text "Desktops" should appear after the text "Home"
