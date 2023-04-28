Feature: Example test for "Then I should see an "element" element"
  As a tester
  I want to make sure that when I'm on a particular page, I should see a specific element

  Scenario: Check "Then I should see an 'element' element" step definition
    Given I am on the homepage
    When I go to "about-us.html"
    Then I should see a "body" element
    And I should see a "#paragraphid" element