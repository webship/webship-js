Feature: Click specific text in table rows
  As a test automation engineer
  I want to be able to click on specific text within table rows
  So that I can interact with table actions based on row content

     Background:
       Given I am on "/test--when--i-click-text-in-table-row.html"

       Scenario: Click Edit button in John Smith row
         When I click "Edit" in the "John Smith" row
         Then I should see "Performed (edit) action on (John Smith)" in the "#action-message" element by attr

        Scenario: Click View Details button in Jane Doe row
          When I click "View Details" in the "Jane Doe" row
          Then I should see "Performed (view) action on (Jane Doe)" in the "#action-message" element by attr

        Scenario: Click Delete button in Bob Johnson row
          When I click "Delete" in the "Bob Johnson" row
          Then I should see "Performed (delete) action on (Bob Johnson)" in the "#action-message" element by attr

        Scenario: Click Download link in Product A row
          When I click "Download" in the "Product A" row
          Then I should see "Performed (download) action on (Product A)" in the "#action-message" element by attr

        Scenario: Click View Details in Order #12345 row
          When I click "View Details" in the "Order #12345" row
          Then I should see "Performed (view) action on (Order #12345)" in the "#action-message" element by attr

        Scenario: Click Track in Order #67890 row
          When I click "Track" in the "Order #67890" row
          Then I should see "Performed (track) action on (Order #67890)" in the "#action-message" element by attr

        Scenario: Multiple table interaction
          When I click "Edit" in the "John Smith" row
           And I wait 1 second
           And I click "Download" in the "Product B" row
          Then I should see "Performed (download) action on (Product B)" in the "#action-message" element by attr