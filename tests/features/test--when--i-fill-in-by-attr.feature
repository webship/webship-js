Feature: An example of filling an input textbox with a value using its attributes.
  As a tester, 
  I want to fill an input field with a value using its attributes.

  Scenario: Fill in the input field using its ID and class attributes.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "#uname" with "John Smith" by attr
      And I fill in "pwordcss" with "1234" by its "class" attr
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Fill in the input field using its placeholder attribute.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "Your full name" with "John Smith" by its "placeholder" attr
      And I fill in "Your Password" with "1234" by attr
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"

  Scenario: Specify a value, then identify and use the field's attribute to fill in the input field.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "John Smith" for "#uname" by attr
     When I fill in "1234" for "pwordcss" by attr
     When I press "Login"
     Then I should see "You enter Username: John Smith and Password: 1234"
  
  Scenario: Fill in the input field with an empty value using its attribute.
    Given I am on "/test--when--i-fill-in.html"
     When I fill in "#uname" with: by attribute
      And I fill in "password" with: by attr
     When I press "Login" by attr
     Then I should see "You enter Username: and Password:"