Feature: Wait step definitions

  Scenario: Wait helpers
    Given I am on the homepage
     When I wait for 1 second
      And I wait for 1 seconds
      And I wait for 1 second for AJAX to finish

  Scenario: Wait for an element to appear
    Given I am on "/wait-conditions.html"
     Then the element "#notice" should not be displayed
     When I press "Show notice"
      And I wait for "#notice" to appear
     Then the element "#notice" should be displayed

  Scenario: Wait for an element to disappear
    Given I am on "/wait-conditions.html"
     Then I should see 1 "#spinner" element
     When I press "Finish loading"
      And I wait for "#spinner" to disappear
     Then I should see 0 "#spinner" elements

  Scenario: Wait for text to appear
    Given I am on "/wait-conditions.html"
     When I press "Show notice"
      And I wait for the text "Notice ready" to appear
     Then the element "#notice" should be displayed

  Scenario: Wait for text to disappear
    Given I am on "/wait-conditions.html"
     Then I should see "Loading data"
     When I press "Finish loading"
      And we wait for text "Loading data" to disappear
     Then I should not see "Loading data"

  Scenario: Wait until the URL contains a fragment
    Given I am on "/wait-conditions.html"
     Then the url should not match "step=2"
     When I press "Go to step 2"
      And I wait until the URL contains "?step=2"
     Then the url should match "step=2"

  Scenario: Wait until the page title is or contains a value
    Given I am on "/wait-conditions.html"
     When I press "Go to step 2"
      And I wait until the page title contains "Step 2"
      And I wait until the page title is "Step 2 - Wait conditions"
     Then "#step" should have text "Step 2"

  Scenario: Wait until a number of elements match
    Given I am on "/wait-conditions.html"
     When I wait until 0 elements match ".result"
      And I press "Load results"
      And I wait until 3 elements match ".result"
     Then I should see 3 ".result" elements
     When I press "Load more"
      And I wait until at least 4 elements match ".result"
     Then I should see 5 ".result" elements

  Scenario: Wait until one element matches
    Given I am on "/wait-conditions.html"
     When I press "Show notice"
      And I wait until 1 element matches "#notice:not([hidden])"
      And I wait until at least 1 element matches "#notice:not([hidden])"
     Then the element "#notice" should be displayed

  Scenario: Eventually the text shows
    Given I am on "/wait-conditions.html"
     When I press "Show notice"
     Then eventually I should see "Notice ready"
     When I press "Go to step 2"
     Then eventually we should see "Step 2" within 8 seconds

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
