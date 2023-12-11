Feature: An example to test for being on any page and go to homepage
  As an anonymous user
  I want to be able to navigate to the homepage from another page, So that I can check the welcome message at homepage
  
  Scenario: Check to be on (the) About Us page then go to home page
    Given I am on "/about-us.html"
     When I go to the homepage
     Then I should see "Welcome to the homepage of the Webship-js Examples"

  