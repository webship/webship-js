Feature: The browser clock
  As a tester,
  I want to set the time the page reads and move it forward,
  so that an autosave, a timeout or a date can be tested without waiting for it.

  Scenario: Advance the clock by milliseconds, seconds and minutes
    Given the system time is "2026-05-08T10:00:00Z"
      And I am on "/clock.html"
     Then "#today" should have text "2026-05-08"
      And "#autosave" should have text "Draft not saved yet"
     When I advance the clock by 1000 ms
     Then "#autosave" should have text "Draft not saved yet"
     When I advance the clock by 29 seconds
     Then "#autosave" should have text "Draft saved"
      And "#session" should have text "Session active"
     When we advance the clock by 1 second
      And I advance the clock by 4 minutes
     Then "#session" should have text "Session active"
     When I advance the clock by 1 minute
     Then "#session" should have text "Session expired"

  Scenario: Set the system time
    Given the system time is "2026-12-31T23:59:00Z"
      And I am on "/clock.html"
     Then "#today" should have text "2026-12-31"
     When I set the system time to "2027-01-01T00:00:30Z"
     Then "#today" should have text "2027-01-01"
