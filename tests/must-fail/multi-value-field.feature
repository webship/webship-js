@must-fail
Feature: Multi-value steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint, within a few seconds.

  Scenario: A multi-value field that is not on the page
    Fails with: No multi-value field "Hobbies" was found after 5 seconds.
    Given I am on "/multi-value-fields.html"
    When I fill in the multi-value field "Hobbies" with the following values:
      | chess |

  Scenario: More values than the field has inputs
    Fails with: The multi-value field "Websites" has 1 input for 2 values.
    Given I am on "/multi-value-fields.html"
    When I fill in the multi-value field "Websites" with the following values:
      | https://example.com |
      | https://example.org |
