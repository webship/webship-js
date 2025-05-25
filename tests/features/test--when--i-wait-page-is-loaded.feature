Feature: An example test to wait until the page is loaded.
      As a tester,
      I want to make sure that I can wait until a page is loaded.

  Scenario: Check waiting for the page to load.
    Given I am on "/test--when-i-wait-page-until-is-loaded.html"
      And I wait until the page loaded
     Then I should see "The waiting process was completed successfully."
