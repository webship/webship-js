Feature: Wait step definitions

  Scenario: Wait helpers
    Given I am on the homepage
     When I wait for 1 second
      And I wait for 1 seconds
      And I wait for 1 second for AJAX to finish

  Scenario: Wait until the pending timers of the page have fired
    Given I am on "/wait-conditions.html"
     When I press "Show notice"
      And I wait until pending timers settle
     Then I should see 1 "#notice:not([hidden])" element

  Scenario: A wait in minutes returns as soon as the page settles
    Given I am on "/wait-conditions.html"
     When I press "Show notice"
      And I wait 1 minute
     Then I should see 1 "#notice:not([hidden])" element
     When I press "Load results"
      And I wait max of 1 minute
     Then I should see 3 ".result" elements
