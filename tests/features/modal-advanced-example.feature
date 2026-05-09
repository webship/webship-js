Feature: Modal Dialog - Advanced Scenarios
  As a QA engineer testing complex modal behaviors
  I want to handle various modal interactions
  So that I can ensure comprehensive modal testing coverage

  Background:
    Given I am on "/test--modal-dialogs.html"

  Scenario: Verify modal with specific title
    When I click "show-welcome-modal" by attr
    And I wait for modal to appear
    Then I should see a modal with title "Welcome Message"
    And I should see "Thank you for joining us!" in the modal
    When I click "OK" in the modal
    And I wait 1 second
    Then I should not see a modal

  Scenario: Handle settings modal with form
    When I click ".open-settings" by attr
    And I wait for the modal to appear
    Then I should see the "settings-modal" modal
    And I should see "User Settings" in the modal dialog
    When I fill in "username" with "john_doe" by attr
    And I fill in "email" with "john@example.com" by "id" attr
    And I click "Save Changes" button in the modal
    And I wait 1 second
    Then I should see "Settings saved successfully" in the modal
    When I click "Close" in the modal dialog
    And I wait 1 second
    Then I should not see a modal

  Scenario: Verify contact modal does not contain error message
    When I click "#contact-form-btn" by attr
    And I wait for modal to appear
    Then I should see a modal
    And I should not see "Payment failed" in the modal
    And I should see "Enter payment details" in the modal dialog
    When I dismiss the modal
    And I wait 1 second
    Then I should not see the modal dialog

  Scenario: Form submission in contact modal
    When I click "#contact-form-btn" by attr
    And I wait for the modal dialog to appear
    Then I should see the modal
    When I fill in the following: by attr
      | contact-name    | Jane Smith            |
      | contact-email   | jane@example.com      |
      | contact-message | This is a test message|
    And I click "Submit" button in the modal
    And I wait 1 second
    Then I should see "Message sent successfully" in the modal
    And I wait for the modal to disappear
    Then I should not see the modal
