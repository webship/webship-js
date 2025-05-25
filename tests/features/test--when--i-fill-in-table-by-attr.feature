Feature: An example of populating a table of input fields with values using their attributes.
      As a tester,
      I want to be able to fill input text fields with values using their attributes.

  Scenario: Check the filling of a table of input fields using different attributes.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following: by attr
    | #uname   | John Smith |
    | pwordcss | 1234       |
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check the filling of a table of input fields using the placeholder attribute.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following: by its "placeholder" attribute
    | Your full name | John Smith |
    | Your Password  | 1234       |
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"