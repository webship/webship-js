Feature: An example of testing for being on the homepage.
      As an anonymous user,
      I want to be able to navigate to the homepage
  so that I can check the welcome message on the homepage.
  
  Scenario: Ensure that you are on the homepage by using 'the' before the word 'homepage'.
    Given I am on the homepage
     Then I should see "Welcome to the homepage of the Webship-js Examples"

  Scenario: Ensure that you are on the homepage without using 'the' before the word 'homepage'.
    Given I am on homepage
     Then I should see "Welcome to the homepage of the Webship-js Examples"

  Scenario: Ensure that you are on the homepage without using 'the' before the word 'homepage' and using 'we' instead of 'I'.
    Given we are on homepage
     Then we should see "Welcome to the homepage of the Webship-js Examples"