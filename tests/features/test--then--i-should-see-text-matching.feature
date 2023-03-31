Feature: Example test for I should see text matching "some text"
As a tester
I want to be able to text matching in a page

  Scenario: Check I should see text matching "some text"
    Given I am on the homepage
     When I go to "about-us.html"
     Then I should see text matching "About Us"
