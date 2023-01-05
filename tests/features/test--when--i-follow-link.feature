Feature: Example test for "When I follow 'link'" 

As a tester
I want to be able to test when a link is clicked, 
it will go to the link path page

  Scenario: Check the "When I follow link" step definitions
    Given I am on "test--when--i-follow-link.html"
     When I follow "About us link"
     Then I should see "About Us"
     
