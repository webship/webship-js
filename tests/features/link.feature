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
