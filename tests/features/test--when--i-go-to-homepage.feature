Feature: An example of testing whether the user is on any page and then navigating to the homepage.

  As an anonymous user,
  I want to be able to navigate to the homepage from another page,
  so that I can check the welcome message on the homepage.
  
  Scenario: Check if on the About Us page, then navigate to the homepage.
    Given I am on "/about-us.html"
     When I go to the homepage
     Then I should see "Welcome to the homepage of the Webship-js Examples"

  