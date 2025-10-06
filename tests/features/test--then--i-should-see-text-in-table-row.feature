Feature: Assert text visibility in table rows
  As a test automation engineer
  I want to verify text content within specific table rows
  So that I can validate data accuracy and proper display in tables

        Background:
            Given I am on "/test--then--i-should-see-text-in-table-row.html"

        Scenario: Verify employee information is displayed correctly
             Then I should see "Admin" in the "John Smith" row
              And I should see "john.smith@company.com" in the "John Smith" row
              And I should see "Engineering" in the "John Smith" row
              And I should see "Active" in the "John Smith" row
              And I should see "$85,000" in the "John Smith" row

        Scenario: Verify different employee roles are displayed
             Then I should see "User" in the "Jane Doe" row
              And I should see "Manager" in the "Bob Johnson" row
              And I should see "User" in the "Alice Cooper" row
              And I should not see "Admin" in the "Jane Doe" row
              And I should not see "Admin" in the "Bob Johnson" row

        Scenario: Verify employee status visibility
             Then I should see "Active" in the "John Smith" row
              And I should see "Active" in the "Jane Doe" row
              And I should see "On Leave" in the "Bob Johnson" row
              And I should see "Inactive" in the "Alice Cooper" row
              And I should not see "Inactive" in the "John Smith" row
              And I should not see "Active" in the "Alice Cooper" row

        Scenario: Verify product inventory information
             Then I should see "Wireless Headphones" in the "WH-2024-001" row
              And I should see "$199.99" in the "Wireless Headphones" row
              And I should see "150" in the "Wireless Headphones" row
              And I should see "In Stock" in the "Wireless Headphones" row
              And I should not see "Out of Stock" in the "Wireless Headphones" row

        Scenario: Verify low stock and out of stock products
             Then I should see "Low Stock" in the "Gaming Mouse" row
              And I should see "5" in the "Gaming Mouse" row
              And I should see "Out of Stock" in the "Office Chair" row
              And I should see "0" in the "Office Chair" row
              And I should not see "In Stock" in the "Gaming Mouse" row
              And I should not see "In Stock" in the "Office Chair" row

        Scenario: Verify order status information
             Then I should see "Completed" in the "ORD-2024-001" row
              And I should see "Michael Chen" in the "ORD-2024-001" row
              And I should see "Processing" in the "ORD-2024-002" row
              And I should see "Sarah Wilson" in the "ORD-2024-002" row
              And I should see "Cancelled" in the "ORD-2024-003" row
              And I should see "Shipped" in the "ORD-2024-004" row

        Scenario: Verify negative assertions for order status
             Then I should not see "Processing" in the "ORD-2024-001" row
              And I should not see "Completed" in the "ORD-2024-002" row
              And I should not see "Shipped" in the "ORD-2024-003" row
              And I should not see "Cancelled" in the "ORD-2024-004" row

        Scenario: Verify project information
             Then I should see "Website Redesign" in the "John Smith" row
              And I should see "75%" in the "Website Redesign" row
              And I should see "High" in the "Website Redesign" row
              And I should see "Mobile App" in the "Jane Doe" row
              And I should see "45%" in the "Mobile App" row
              And I should see "Medium" in the "Mobile App" row

        Scenario: Verify project progress and priorities
             Then I should see "90%" in the "API Integration" row
              And I should see "High" in the "API Integration" row
              And I should see "3 members" in the "API Integration" row
              And I should not see "Low" in the "API Integration" row
              And I should not see "100%" in the "API Integration" row

        Scenario: Cross-table data verification
             Then I should see "John Smith" in the "john.smith@company.com" row
              And I should see "John Smith" in the "Website Redesign" row
              And I should see "Jane Doe" in the "jane.doe@company.com" row
              And I should see "Jane Doe" in the "Mobile App" row
              And I should not see "Bob Johnson" in the "Website Redesign" row
              And I should not see "Alice Cooper" in the "Mobile App" row

        Scenario: Verify currency and numeric data
             Then I should see "$199.99" in the "Wireless Headphones" row
              And I should see "$79.99" in the "Gaming Mouse" row
              And I should see "$299.99" in the "Office Chair" row
              And I should see "$49.99" in the "Laptop Stand" row
              And I should not see "$0.00" in the "Wireless Headphones" row
              And I should not see "$999.99" in the "Gaming Mouse" row

        Scenario: Verify date and timestamp information
             Then I should see "2024-08-15" in the "ORD-2024-001" row
              And I should see "2024-08-16" in the "ORD-2024-002" row
              And I should see "2024-09-15" in the "Website Redesign" row
              And I should see "2024-10-30" in the "Mobile App" row
              And I should not see "2023-01-01" in the "ORD-2024-001" row