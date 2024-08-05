Feature: An example of filling the input textbox with value by its attribute
As a tester
I want to be able to fill input text with value by its attribute

  Scenario: Check fill in input field with ready format attribute
    Given I am on "/test--when--i-fill-in.html"
      When I fill in "#uname" with "John Smith" by attr
      And I fill in "pwordcss" with "1234" by its "class" attr
      When I press "Login"
      Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check fill in input field with value and placeholder attribute
    Given I am on "/test--when--i-fill-in.html"
      When I fill in "Your full name" with "John Smith" by its "placeholder" attr
      And I fill in "Your Password" with "1234" by attr
      When I press "Login"
      Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Check fill in value for input field
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "John Smith" for "#uname" by attr
     When I fill in "1234" for "pwordcss" by attr
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"
  
  Scenario: Check fill in input field with empty value
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "#uname" with: by attribute
     And I fill in "password" with: by attr
     When I press "Login" by attr
     Then I should see "You enter Username: and Password:"