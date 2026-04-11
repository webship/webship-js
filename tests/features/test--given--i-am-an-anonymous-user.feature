Feature: Given I am an anonymous user

  Scenario: Anonymous user is redirected to homepage with no cookies
    Given I am an anonymous user
    Then the url should match "\/"

  Scenario: Anonymous user cannot access a protected page
    Given I am an anonymous user
    When I go to "/account"
    Then I should not be on the "/account" page
