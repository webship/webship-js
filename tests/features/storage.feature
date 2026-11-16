Feature: Cookie, local storage and session storage steps
  As a tester,
  I want to set, remove and clear cookies, local storage and session storage from a scenario,
  so that a page starts in the state the scenario needs without clicking through the site.

  Scenario: A cookie set before the first page is sent with that page
    Given the cookie "theme" is set to "dark"
    When I am on "/storage.html"
    Then "#cookies" should have text "theme = dark"
    And a cookie with the name "theme" and the value "dark" should exist

  Scenario: A cookie set on a loaded page shows after a reload
    Given I am on "/storage.html"
    Then "#cookies" should have text "No cookies"
    When cookie "ab_bucket" is set to "variant-b"
    And I reload the page
    Then "#cookies" should have text "ab_bucket = variant-b"

  Scenario: Removing one cookie keeps the other cookies
    Given I am on "/storage.html"
    And the cookie "theme" is set to "dark"
    And the cookie "lang" is set to "en"
    When I reload the page
    Then "#cookies" should contain text "theme = dark"
    And "#cookies" should contain text "lang = en"
    When the cookie "theme" is removed
    And I reload the page
    Then "#cookies" should have text "lang = en"
    And a cookie with the name "theme" should not exist
    And a cookie with the name "lang" and the value "en" should exist

  Scenario: Clearing all cookies leaves none
    Given I am on "/storage.html"
    And the cookie "theme" is set to "dark"
    And the cookie "lang" is set to "en"
    When I reload the page
    And "#cookies li" should have a count of 2
    When all cookies are cleared
    And I reload the page
    Then "#cookies" should have text "No cookies"
    And a cookie with the name "theme" should not exist
    And a cookie with the name "lang" should not exist

  Scenario: Local storage entries are set, removed one by one, then gone
    Given I am on "/storage.html"
    Then "#local-storage" should have text "Local storage is empty"
    When the local storage "theme" is set to "dark"
    And local storage "lang" is set to "fr"
    And I reload the page
    Then "#local-storage li" should have a count of 2
    And "#local-storage" should contain text "theme = dark"
    And "#local-storage" should contain text "lang = fr"
    When the local storage "theme" is removed
    And I reload the page
    Then "#local-storage" should have text "lang = fr"
    When local storage "lang" is removed
    And I reload the page
    Then "#local-storage" should have text "Local storage is empty"

  Scenario: Clearing local storage leaves the session storage alone
    Given I am on "/storage.html"
    And the local storage "theme" is set to "dark"
    And the local storage "onboarding_complete" is set to "true"
    And the session storage "wizard progress" is set to "3/5"
    When I reload the page
    Then "#local-storage li" should have a count of 2
    When local storage is cleared
    And I reload the page
    Then "#local-storage" should have text "Local storage is empty"
    And "#session-storage" should have text "wizard progress = 3/5"

  Scenario: Session storage entries are set, removed one by one, then gone
    Given I am on "/storage.html"
    Then "#session-storage" should have text "Session storage is empty"
    When the session storage "checkout step" is set to "2"
    And session storage "tab id" is set to "tab-1"
    And I reload the page
    Then "#session-storage li" should have a count of 2
    And "#session-storage" should contain text "checkout step = 2"
    And "#session-storage" should contain text "tab id = tab-1"
    When the session storage "checkout step" is removed
    And I reload the page
    Then "#session-storage" should have text "tab id = tab-1"
    When session storage "tab id" is removed
    And I reload the page
    Then "#session-storage" should have text "Session storage is empty"

  Scenario: Clearing session storage leaves the local storage alone
    Given I am on "/storage.html"
    And the session storage "checkout step" is set to "2"
    And the session storage "from checkout" is set to "true"
    And the local storage "theme" is set to "dark"
    When I reload the page
    Then "#session-storage li" should have a count of 2
    When session storage is cleared
    And I reload the page
    Then "#session-storage" should have text "Session storage is empty"
    And "#local-storage" should have text "theme = dark"
