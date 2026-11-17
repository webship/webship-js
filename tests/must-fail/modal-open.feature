@must-fail
Feature: Modal steps that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint, within a few seconds.

  Scenario: A click in the modal when no modal is open
    Fails with: No modal is open: none was visible after 5 seconds.
    Given I am on "/modal.html"
    When I click "OK" in the modal

  Scenario: A click on an element in the modal when no modal is open
    Fails with: No modal is open: none was visible after 5 seconds.
    Given I am on "/modal.html"
    When I click on "#close-btn" in the modal

  Scenario: Closing the modal when no modal is open
    Fails with: No modal is open: none was visible after 5 seconds.
    Given I am on "/modal.html"
    When I close the modal

  Scenario: A button the open modal does not have
    Fails with: The open modal has no button or link "Launch".
    Given I am on "/modal.html"
    When I click on the element "#open"
    And I click "Launch" in the modal
