Feature: The settle after a step waits for the page as long as its budget allows
  After a step that changes the page, webship-js waits for the page to settle
  for up to 1.5 seconds. The last phase of that wait (the requests, the
  timers and the DOM falling quiet) may use every millisecond the earlier
  phases left, so a page that answers one second after a press is settled
  before the next step reads it.

  Scenario: A press whose answer comes one second later
    Given I am on "/settle-budget.html"
     When I press "Load"
     Then I should see "Loaded" in the "#status" element
