Feature: Native browser dialogs
  As a tester,
  I want to answer a prompt and read what a dialog said,
  so that a flow behind an alert, a confirm or a prompt can be tested.

  Scenario: Accept the next prompt with a text
    Given I am on "/native-dialogs.html"
      And I will accept the next dialog with "Quarterly report"
     When I press "Rename item"
     Then I should see "Name: Quarterly report"
      And the last dialog type should be "prompt"
      And the last dialog message should contain "new name"

  Scenario: Read a part of the message of a confirm
    Given I am on "/native-dialogs.html"
      And we will accept the next dialog with "ignored by a confirm"
     When I press "Delete item"
     Then I should see "Item deleted #1"
      And the last dialog message should contain "Delete this"
      And the last dialog type should be "confirm"

  Scenario: Dismiss a prompt
    Given I am on "/native-dialogs.html"
      And I will dismiss the next dialog
     When I press "Rename item"
     Then I should see "Rename cancelled"
      And the last dialog message should contain "Enter the new name"
