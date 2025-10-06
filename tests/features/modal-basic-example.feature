Feature: Modal Dialog - Basic Interactions
  As a user testing modal dialogs
  I want to interact with modal windows
  So that I can verify modal functionality works correctly

  Background:
    Given I am on "/test--modal-dialogs.html"

  Scenario: Modal should not appear initially
    Then I should not see a modal

  Scenario: Open and verify modal visibility
    When I click "show-modal" by attr
    And I wait for the modal to appear
    Then I should see a modal
    And I should see "Welcome" in the modal
    And I should see "This is a sample modal dialog" in the modal dialog

  Scenario: Click confirm button in modal
    When I click "trigger-modal" by attr
    And I wait for the modal to appear
    Then I should see a modal
    When I click "Confirm" in the modal
    And I wait 1 second
    Then I should not see a modal

  Scenario: Close modal using close button
    When I click "#show-modal" by attr
    And I wait for modal to appear
    Then I should see the modal
    When I close the modal
    And I wait for the modal to disappear
    Then I should not see the modal

  Scenario: Verify specific modal by identifier
    When I click "delete-btn" by attr
    And I wait for modal to appear
    Then I should see a "delete-confirmation-modal" modal
    And I should see "Are you sure you want to delete this item?" in the modal
    When I click "Cancel" button in the modal dialog
    And I wait 1 second
    Then I should not see the modal dialog
