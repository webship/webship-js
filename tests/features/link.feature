Feature: Link step definitions

  Scenario: Link href + title assertions
    Given I am on "/links.html"
     Then the link "About" with the href "/about" should exist
      And the link "Contact" with the href "/contact" within the element "#nav" should exist
      And the link "About" with the href "/missing" should not exist
      And the link with the title "About us" should exist
      And the link with the title "Nonexistent" should not exist
      And the link "Example" should be an absolute link
      And the link "About" should not be an absolute link

  Scenario: No link with the text and the href within an element
    Given I am on "/links.html"
     Then the link "Contact" with the href "/contact" within the element "#nav" should exist
      And the link "About" with the href "/about" within the element "#nav" should not exist
      And the link "Contact" with the href "/missing" within the element "#nav" should not exist

  Scenario: Click on the link with a title
    Given I am on "/links.html"
     When I click on the link with the title "Meet the team"
     Then I should be on "/about-us.html"
