@must-fail
Feature: Iframe steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint.

  Scenario: A text that is not inside the iframe
    Fails with: The text "Payment received" was not found inside the iframe after 5 seconds.
    Given I am on "/iframe.html"
    When I switch to iframe "#order-frame"
    Then I should see "Payment received" inside the iframe

  Scenario: A text that is inside the iframe
    Fails with: The text "Order form inside the iframe" is inside the iframe, but it should not be.
    Given I am on "/iframe.html"
    When I switch to iframe "#order-frame"
    Then I should not see "Order form inside the iframe" inside the iframe
