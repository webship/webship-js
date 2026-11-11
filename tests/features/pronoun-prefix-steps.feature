Feature: Steps that open with the optional "I " or "we " run
  As a tester,
  I want every step that takes the optional pronoun to run,
  because cucumber-js refuses a step whose function declares fewer parameters
  than its pattern has groups: "function has 0 arguments, should have 1".

  Scenario: Print the accessibility violations
    Given I am on "/a11y.html"
    Then I print accessibility violations

  Scenario: Clear the auth state
    Given I am on "/cookies.html"
    Then a cookie with the name "session_id" should exist
    When I clear the auth state
    Then a cookie with the name "session_id" should not exist

  Scenario: Pause and resume the clock
    Given the system time is "2026-05-08T10:00:00Z"
    And I am on the homepage
    When I pause the clock
    And I resume the clock
    Then I should see "Step Definitions Examples:"

  Scenario: Accept the next dialog
    Given I am on "/native-dialogs.html"
    And I will accept the next dialog
    When I press "Delete item"
    Then I should see "Item deleted #1"
    And the last dialog message should be "Delete this item?"

  Scenario: Dismiss the next dialog
    Given I am on "/native-dialogs.html"
    And I will dismiss the next dialog
    When I press "Delete item"
    Then I should see "Deletion cancelled #1"
    And the last dialog type should be "confirm"

  Scenario: Accept all confirmation dialogs
    Given I am on "/native-dialogs.html"
    And I accept all confirmation dialogs
    When I press "Delete item"
    And I press "Delete item"
    Then I should see "Item deleted #2"

  Scenario: Do not accept any confirmation dialogs
    Given I am on "/native-dialogs.html"
    And I do not accept any confirmation dialogs
    When I press "Delete item"
    And I press "Delete item"
    Then I should see "Deletion cancelled #2"

  Scenario: Switch to the root document
    Given I am on the homepage
    When I switch to the root document
    Then I should see "Step Definitions Examples:"

  Scenario: Start recording network requests
    Given I am on the homepage
    And I start recording network requests
    When I go to "/about-us.html"
    Then a request to "about-us.html" should have been made
    And no request to "contact-us.html" should have been made

  Scenario Outline: Wait until the page settles
    Given I am on the homepage
    When I wait until <condition>
    Then I should see "Step Definitions Examples:"

    Examples:
      | condition               |
      | the network is idle     |
      | requests are complete   |
      | network goes quiet      |
      | the page is interactive |
      | page is interactive     |
      | pending timers settle   |

  Scenario: Print the last XML and YAML responses
    Given I am on the homepage
    When I print last XML response
    And I print last YAML response
