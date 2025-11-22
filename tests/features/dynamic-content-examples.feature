Feature: Dynamic Content Handling Examples
  As a tester
  I want to test dynamically loaded content
  So that I can verify the application works with JavaScript-rendered elements

  Background:
    Given I am on "/dynamic-examples.html"

  # Example 1: Clicking a button that appears after page load
  Scenario: Click dynamically loaded button
    When I wait 2 seconds
    Then I should see "Dynamic Content Loaded"
    When I press "Submit Form" button
    Then I should see "Form submitted successfully"

  # Example 2: Filling form fields that are added by JavaScript
  Scenario: Fill in dynamically rendered form fields
    When I click "Show Registration Form"
    And I wait 1 second
    When I fill in "john.doe@example.com" for "#email" by attr
    And I fill in "John Doe" for "#fullname" by attr
    And I fill in "SecurePass123" for "#password" by attr
    And I press "Register" button
    Then I should see "Registration successful"

  # Example 3: Selecting options from dynamically populated dropdown
  Scenario: Select from dynamically loaded dropdown options
    When I scroll down 200
    And I wait 1 second
    When I click "Load Countries"
    And I wait 2 seconds
    When I select "United States" from "country"
    Then I should see "You selected: United States"

  # Example 4: Clicking links in dynamically loaded table rows
  Scenario: Interact with dynamically loaded table rows
    When I scroll down 400
    And I wait 1 second
    When I click "Load Users Table"
    And I wait 2 seconds
    Then I should see "John Smith" in the "john@example.com" row
    When I click "Edit" in the "john@example.com" row
    Then I should see "Editing user: john@example.com"

  # Example 5: Checking dynamically added checkboxes
  Scenario: Check dynamically rendered checkboxes
    When I scroll down 600
    And I wait 1 second
    When I click "Show Preferences"
    And I wait 1 second
    When I check "#newsletter"
    And I check "#notifications"
    Then the "#newsletter" checkbox should be checked
    And the "#notifications" checkbox should be checked

  # Example 6: Uploading file to dynamically rendered input
  Scenario: Upload file to dynamic file input
    When I scroll down 800
    And I wait 1 second
    When I click "Enable File Upload"
    And I wait 1 second
    When I attach the file "test-document.pdf" to "#file-upload"
    Then I should see "File selected: test-document.pdf"

  # Example 7: Scrolling to dynamically added elements
  Scenario: Scroll to dynamically loaded content section
    When I scroll down 1200
    And I wait 1 second
    When I click "Load More Content"
    And I wait 2 seconds
    When I scroll to bottom of "#content-container"
    Then I should see "End of dynamic content"

  # Example 8: Handling removed elements (should not interact)
  Scenario: Verify removed elements are not interacted with
    When I scroll down 1400
    And I wait 1 second
    When I click "Show Temporary Button"
    And I wait 1 second
    Then I should see a "temp-action" element by its "id" attr
    When I click "Remove Button"
    And I wait 1 second
    # This should fail gracefully if the button is removed
    # Then I should not see a "temp-action" element by its "id" attr

  # Example 9: Single Page Application navigation with dynamic content
  Scenario: Navigate in SPA with dynamically loaded pages
    When I scroll down 1600
    And I wait 1 second
    When I click "Products" by its "data-page" attribute
    And I wait 1 second
    Then I should see "Product Catalog"
    When I click "Add to Cart" in the "Laptop Pro 15" row
    Then I should see "Item added to cart"

  # Example 10: Batch form filling with dynamically rendered fields
  Scenario: Fill multiple dynamic form fields using table
    When I scroll down 1800
    And I wait 1 second
    When I click "Show Contact Form"
    And I wait 2 seconds
    When I fill in the following: by attr
      | #contact-name    | Jane Smith          |
      | #contact-email   | jane@example.com    |
      | #contact-phone   | +1-555-0123         |
      | #contact-message | This is a test message |
    And I press "Send Message" button
    Then I should see "Message sent successfully"

  # Example 11: Testing AJAX-loaded content after user action
  Scenario: Interact with AJAX-loaded search results
    When I scroll down 2200
    And I wait 1 second
    When I fill in "laptop" for "#search-input" by attr
    And I press "Search" button
    And I wait 2 seconds
    Then I should see "Search Results"
    When I click "View Details" in the "Laptop Pro 15" row
    Then I should see "Product Details"

  # Example 13: Infinite scroll content loading
  Scenario: Load more content with infinite scroll
    When I scroll down 2600
    And I wait 1 second
    When I scroll to bottom
    And I wait 2 seconds
    Then I should see "Loading more items"
    And I wait 3 seconds
    Then I should see "Item 21"
    When I scroll to bottom
    And I wait 2 seconds
    Then I should see "Item 41"

  # Example 14: React/Vue component interactions
  Scenario: Interact with React component rendered buttons
    When I scroll down 3000
    And I wait 1 second
    When I click "Initialize App"
    And I wait 2 seconds
    Then I should see "React App Loaded"
    When I press "increment-btn" by its "id" attribute
    And I press "increment-btn" by its "id" attribute
    And I press "increment-btn" by its "id" attribute
    Then I should see "Count: 3"

  # Example 15: Conditional rendering based on user selection
  Scenario: Handle conditionally rendered form fields
    When I scroll down 3400
    And I wait 1 second
    When I select "Business" from "account-type"
    And I wait 1 second
    Then I should see a "company-name" element by attr
    When I fill in "Acme Corporation" for "company-name" by attr
    And I fill in "12-3456789" for "tax-id" by attr
    And I press "Continue" button
    Then I should see "Business account created"
