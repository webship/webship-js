Feature: Example test for filling text with value
As a developer
I want to be able to test when fill input text with value, 
with empty value, value for text, and fill in table

  Scenario: Check fill in input field with value
    Given I am on homepage
     When I go to "test--when--i-fill-in.html"
     When I fill in "Username" with "webshipco"
     When I fill in "Password" with "1234"
     When I press "Login"
     Then I should see "You enter Username: webshipco and Password: 1234"

  Scenario: Check fill in input field with empty value
    Given I am on homepage
     When I go to "test--when--i-fill-in.html"
     When I fill in "Username" with:
     When I press "Login"
     Then I should see "You enter Username: "
     
  Scenario: Check fill in value for input field
    Given I am on homepage
     When I go to "test--when--i-fill-in.html"
     When I fill in "webshipco" for "Username"
     When I fill in "1234" for "Password"
     When I press "Login"
     Then I should see "You enter Username: webshipco and Password: 1234"

  Scenario: Check fill in table of input fields
    Given I am on homepage
     When I go to "test--when--i-fill-in.html"
     When I fill in the following:
              | username | webshipco |
              | password | 1234 |
     When I press "Login"
     Then I should see "You enter Username: webshipco and Password: 1234"
