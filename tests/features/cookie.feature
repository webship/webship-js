Feature: Cookie step definitions

  Scenario: Cookie existence and value matching
    Given I am on "/cookies.html"
     Then a cookie with the name "session_id" should exist
      And a cookie with the name "session_id" and the value "abc123" should exist
      And a cookie with the name "preferences" and a value containing "darkmode" should exist
      And a cookie with a name containing "session" should exist
      And a cookie with a name containing "pref" and a value containing "darkmode" should exist
      And a cookie with the name "missing" should not exist
      And a cookie with the name "language" and the value "fr" should not exist
      And a cookie with the name "preferences" and a value containing "lightmode" should not exist
      And a cookie with a name containing "old" should not exist

  Scenario: Part of a cookie name together with its value
    Given I am on "/cookies.html"
     Then a cookie with a name containing "pref" and the value "darkmode-enabled" should exist
      And a cookie with a name containing "session" and the value "abc123" should exist
      And a cookie with a name containing "session" and the value "expired" should not exist
      And a cookie with a name containing "lang" and the value "fr" should not exist
      And a cookie with a name containing "pref" and a value containing "lightmode" should not exist
      And a cookie with a name containing "old" and a value containing "darkmode" should not exist
