Feature: An example of filling the input text with value by attribute
As a tester
I want to be able to fill input text with value by attribute

  Scenario: Check fill in table of input fields by different attribute
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following: by attr
              | #uname | John Smith |
              | pwordcss | 1234 |
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check fill in table of input fields by specific attribute
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following: by its "placeholder" attribute
              | Your full name | John Smith |
              | Your Password | 1234 |
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"