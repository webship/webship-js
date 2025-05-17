Feature: An example test Scrolling page to the bottom.
  
  As a tester, 
  I want to make sure that I can arrive the bottom of the current page.

  Scenario: Check Scrolling page to the bottom.
    Given I am on "/test--when--i-scroll-to-the-bottom.html"
     When I scroll to the bottom
     Then I should see "Scrolling has reached the bottom"