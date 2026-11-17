Feature: Storage and cookie values with a double quote
  As a tester,
  I want to set a value that holds a double quote, such as JSON,
  so that a page can start with the state it reads from local storage, session storage or a cookie.

  Scenario: A local storage value that holds JSON
    Given I am on "/storage.html"
     When the local storage "prefs" is set to "{\"theme\":\"dark\"}"
      And I reload the page
     Then I should see text matching "prefs = \{\x22theme\x22:\x22dark\x22\}"

  Scenario: A session storage key and value with double quotes
    Given I am on "/storage.html"
     When the session storage "the \"last\" note" is set to "say \"hi\""
      And I reload the page
     Then I should see text matching "the \x22last\x22 note = say \x22hi\x22"
     When the session storage "the \"last\" note" is removed
      And I reload the page
     Then "#session-storage" should have text "Session storage is empty"

  Scenario: A cookie value wrapped in double quotes
    Given I am on "/storage.html"
     When the cookie "wrapped" is set to "\"dark\""
     Then a cookie with the name "wrapped" and the value "\"dark\"" should exist
     When the cookie "wrapped" is removed
     Then a cookie with the name "wrapped" should not exist
