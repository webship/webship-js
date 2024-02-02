Feature: An example of filling the input textbox with value
As a tester
I want to be able to fill input text with value

  Scenario: Check fill in input field with value
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "#uname" with "John Smith"
     When I fill in "#pword" with "1234"
     When I press "Login"
     Then I should see "You enter #uname: John Smith and Password: 1234"

  Scenario: Check fill in input field with empty value
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "#uname" with:
     When I press "Login"
     Then I should see "You enter Username: "
     
  Scenario: Check fill in value for input field
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "John Smith" for "#uname"
     When I fill in "1234" for "#pword"
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check fill in table of input fields
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following:
              | #uname | John Smith |
              | #pword | 1234 |
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"
