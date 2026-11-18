Feature: Follow the link a person sees when a collapsed menu repeats it first
  As a tester
  I want to follow a link by its text
  So that a hidden copy of it in a closed menu is not the one the step waits on

  Scenario: Follow a link whose hidden copy comes first in the page
    Given I am on "/follow-hidden-first.html"
    When I follow "Bags"
    Then the url should match "#bags$"
