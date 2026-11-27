@must-fail
Feature: Fill steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint, within a few seconds.

  Scenario: A field that is hidden
    Fails with: The field "Hidden note" is on the page but hidden, so it cannot be filled.
    Given I am on "/fill-unreachable.html"
    When I fill in "Hidden note" with "Some words"

  Scenario: A field that is disabled
    Fails with: The field "Locked code" is disabled, so it cannot be filled.
    Given I am on "/fill-unreachable.html"
    When I fill in "Locked code" with "X2"

  Scenario: A field that is read-only
    Fails with: The field "Reference" is read-only, so it cannot be filled.
    Given I am on "/fill-unreachable.html"
    When I fill in "R-2" for "Reference"

  Scenario: A hidden field named by attribute
    Fails with: The field "#note" is on the page but hidden, so it cannot be filled.
    Given I am on "/fill-unreachable.html"
    When I fill in "#note" with "Some words" by attr

  Scenario: A field named by attribute that is not on the page
    Fails with: No field with "no-such-field" was found after 5 seconds.
    Given I am on "/fill-unreachable.html"
    When I fill in "no-such-field" with "Some words" by attr

  Scenario: Two visible fields under one label
    Fails with: Could not fill the field "Nickname".
    Given I am on "/fields-in-hidden-dialogs.html"
    When I fill in "Nickname" with "Sam"

  Scenario: A label whose fields are all in hidden dialogs
    Fails with: The field "Secret" is on the page but hidden, so it cannot be filled.
    Given I am on "/fields-in-hidden-dialogs.html"
    When I fill in "Secret" with "Some words"
