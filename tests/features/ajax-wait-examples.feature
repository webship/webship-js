Feature: AJAX Wait Examples
  As a tester
  I want to wait for AJAX requests to complete
  So that I can verify content that loads asynchronously

  Background:
    Given I am on "/ajax-wait-examples.html"

  # Example 1: Wait for AJAX to finish before verifying content
  Scenario: Wait for AJAX to finish after search
    When I fill in "laptop" for "#search-input" by attr
    And I press "Search" button
    And I wait for AJAX to finish
    Then I should see "Search Results"
    And I should see "Laptop Pro 15"

  # Example 2: Wait for AJAX to finish after form submission
  Scenario: Wait for AJAX to finish after submitting form
    When I fill in "John Doe" for "#name-input" by attr
    And I fill in "john@example.com" for "#email-input" by attr
    And I press "Submit" button
    And I wait for AJAX to finish
    Then I should see "Form submitted successfully"
    And I should see "Thank you, John Doe"
