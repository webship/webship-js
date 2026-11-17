Feature: Act in an open modal
  As a tester,
  I want the steps that act in a modal to work on the modal that is open,
  so that a scenario can click and close it as before.

  Scenario: Click a button of the open modal by its text, then close it
    Given I am on "/modal.html"
     When I click on the element "#open"
      And I click "X" in the modal
     Then I should not see the modal
     When I click on the element "#open"
      And I close the modal
     Then I should not see the modal
