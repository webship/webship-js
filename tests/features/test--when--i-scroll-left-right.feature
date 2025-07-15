Feature: Complete scrolling functionality test
      As a tester,
      I want to test all scrolling step definitions to ensure they work correctly.

  Scenario: Test basic scroll down functionality
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll down
     Then I should see "Basic scroll down works"

  Scenario: Test basic scroll up functionality
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll to the bottom
      And I scroll up
     Then I should see "Basic scroll up works"

  Scenario: Test scroll down with custom value
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll down 500
     Then I should see "Custom scroll down works"

  Scenario: Test scroll up with custom value
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll to the bottom
      And I scroll up 300
     Then I should see "Custom scroll up works"

  Scenario: Test scroll to top functionality
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll to the bottom
      And I scroll to top
     Then I should see "Scroll to top works"

  Scenario: Test scroll to bottom functionality
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll to the bottom
     Then I should see "Scroll to bottom works"


  Scenario: Test scroll to top of element
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll to bottom of "#scrollable-container"
      And I scroll to top of "#scrollable-container"
     Then I should see "Element scroll to top works"

  Scenario: Test scroll to bottom of element
    Given I am on "/test--when--i-scroll-left-right-functionality.html"
     When I scroll to bottom of "#scrollable-container"
     Then I should see "Element scroll to bottom works"
