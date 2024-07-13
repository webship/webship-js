Feature: An example of filling the input textbox with value
As a tester
I want to be able to fill input text with value

  Scenario: Check fill in input field with value
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "Username" with "John Smith"
     When I fill in "Password" with "1234"
     When I press "Login" by attr
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check fill in input field with empty value
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "uname" with: by its "id" attribute
     And I fill in "Your Password" with: by attr
     When I press "Login" by attr
     Then I should see "You enter Username: and Password:"
     
  Scenario: Check fill in value for input field
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "John Smith" for "Username"
     When I fill in "1234" for "pword" by its "id" attr
     When I press "Login" by attr
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check fill in table of input fields
    Given I am on "/test--when--i-fill-in.html"
     When I fill in the following:
              | Username | John Smith |
              | Password | 1234 |
     When I press "Login" by attr
     Then I should see "You enter Username: John Smith and Password: 1234"
