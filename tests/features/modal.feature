Feature: Modal step definitions

  Scenario: Open and inspect modal
    Given I am on "/modal.html"
     Then I should not see the modal
     When I click on the element "#open"
      And I wait for the modal to appear
     Then I should see the modal
      And the modal should contain "Welcome modal text"
      And the modal should not contain "Goodbye"
     When I click on "#close-btn" in the modal
