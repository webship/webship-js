Feature: An example test to wait for a specific maximum number of seconds/minutes for the page to load.
  
  As a tester,
  I want to make sure that I can wait for a page to load and for an element to become visible.

  Scenario: Check waiting 6 seconds for the page content to load.
    Given I am on the homepage
     When I go to "/test--when-i-wait-specific-time.html"
      And I wait 6 seconds
     Then I should see "Welcome with waiting full time"

  Scenario: Check waiting 3s for the page content to load.
    Given I am on the homepage
     When I go to "/test--when-i-wait-specific-time.html"
      And I wait 3s
     Then I should see "Welcome with waiting full time"

Scenario: Check waiting a maximum of 6 seconds for the page content to load.
    Given I am on the homepage
     When I go to "/test--when-i-wait-max-of-time.html"
      And I wait max of 6 seconds
     Then I should see "Welcome with waiting until page load"