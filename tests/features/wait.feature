Feature: Wait step definitions

  Scenario: Wait helpers
    Given I am on the homepage
     When I wait for 1 second
      And I wait for 1 seconds
      And I wait for 1 second for AJAX to finish
