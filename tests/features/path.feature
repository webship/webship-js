Feature: Path step definitions

  Scenario: Path and query parameter assertions
    Given I am on "/path.html?lang=en&debug=1"
     Then the path should be "/path.html"
      And the path should not be "/wrong"
      And current url should have the "lang" parameter
      And current url should have the "lang" parameter with the "en" value
      And current url should not have the "missing" parameter
      And current url should not have the "lang" parameter with the "fr" value

  Scenario: History navigation
    Given I am on "/path.html"
     When I go to "/element.html"
      And I go back
     Then the path should be "/path.html"
