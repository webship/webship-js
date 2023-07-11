Feature: An example to test seeing for a specific element on current page
  As a user
  I want to make sure that when I'm on a particular page, I should see a specific element

  Scenario: Check to test seeing for a specific element
    Given I am on "/about-us.html"
    Then I should see a "body" element
    And I should see a "#paragraphid" element