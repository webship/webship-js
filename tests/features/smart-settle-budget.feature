Feature: Smart wait stays inside its budget

  A page with analytics, a chat widget or a self-rescheduling timer never
  reaches network idle and never drains its pending timers. The smart wait has
  to spend its budget and hand control back, rather than block until cucumber
  kills the step.

  Scenario: A page that never settles does not stall the run
    Given I am on "/never-settles.html"
    Then I should see "Never Settles"
    When I wait until the page is loaded
    Then I should see "Never Settles"
