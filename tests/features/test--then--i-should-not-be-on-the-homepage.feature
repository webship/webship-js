Feature: An example to ensure that a page is or is not the homepage
  As an anonymous user,
  I want the homepage assertion to tell the homepage from the other pages

  Scenario: Another page of the site is not the homepage
    Given I am on the homepage
     When I go to "/about-us.html"
     Then I should not be on the homepage
      And I should be on "/about-us.html"

  Scenario: The query and the fragment of the address do not count
    Given I am on "/?ref=menu#top"
     Then I should be on the homepage
      And I should not be on "/about-us.html"

  Scenario: Back on the homepage after another page
    Given I am on the homepage
     When I go to "/about-us.html"
      And I move backward one page
     Then I should be on the homepage
