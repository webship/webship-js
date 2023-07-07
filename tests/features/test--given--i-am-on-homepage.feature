Feature: An example to test for being on the homepage
  As an anonymous user
  I want to be able to navigate to the homepage
  So that I can check the welcome message at homepage

  Scenario: Check being on the homepage
    Given I am on the homepage
    Then I should see "Welcome to the homepage of the Webship-js Examples"

  Scenario: Check being on homepage
    Given I am on homepage
    Then I should see "Welcome to the homepage of the Webship-js Examples"
