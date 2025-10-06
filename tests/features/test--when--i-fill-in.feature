Feature: An example of filling an input textbox with a value using its label.
  As a tester,
  I want to be able to fill input text fields with values using their labels.

  Scenario: Check filling an input field with a value using its label.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "Username" with "John Smith"
     When I fill in "Password" with "1234"
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check filling in a value for an input field using its label.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "John Smith" for "Username"
     When I fill in "1234" for "Password"
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check filling an input field with an empty value using its label.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "Username" with:
      And I fill in "Password" with:
     When I press "Login"
     Then I should see "You enter Username: and Password:"
     
  Scenario: Check filling a table of input fields using their labels.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following:
    | Username | John Smith |
    | Password | 1234       |
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"
