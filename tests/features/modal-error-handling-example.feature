Feature: Modal Dialog - Error Handling and Edge Cases
  As a test automation engineer
  I want to verify modal error states and edge cases
  So that I can ensure robust modal functionality

  Background:
    Given I am on the "/test--modal-dialogs.html" page

  Scenario: Confirm deletion with modal
    When I click "Delete" in the "Project Alpha" row
    And I wait for the modal to appear
    Then I should see a modal
    And I should see "Are you sure you want to delete Project Alpha?" in the modal
    When I click "Yes, Delete" button in the modal
    And I wait for the modal to disappear
    Then I should not see a modal
    And I should see "Project deleted successfully"

  Scenario: Cancel deletion action dismisses modal
    When I click "Delete" in the "Project Beta" row
    And I wait for modal to appear
    Then I should see the modal dialog
    And I should see "Are you sure you want to delete Project Beta?" in the modal
    When I click "Cancel" in the modal
    And I wait 1 second
    Then I should not see the modal dialog

  Scenario: Delete confirmation modal content verification
    When I click "delete-btn" by attr
    And I wait for modal to appear
    Then I should see a "delete-confirmation-modal" modal
    And I should see "Are you sure you want to delete this item?" in the modal
    And I should see "This action cannot be undone" in the modal dialog
    And I should not see "Item has been deleted" in the modal
    When I click "Cancel" button in the modal
    And I wait 1 second
    Then I should not see a modal
