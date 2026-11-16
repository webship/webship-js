Feature: Selector position step definitions, left and right
  As a tester,
  I want to assert that a named component sits to the left or to the right of another,
  so that the layout of a row can be tested.

  Background:
    Given I am on "/selectors-position.html"
      And I define css selectors:
        | logo   | #logo   |
        | menu   | #menu   |
        | search | #search |

  Scenario: A component is to the left of another
     Then I see logo to the left of menu

  Scenario: A component is to the left of several others
     Then I see logo to left of menu, search

  Scenario: A component is to the right of another
     Then I see search to the right of menu

  Scenario: A component is to the right of several others
     Then I see search to right of logo, menu

  Scenario: A component is over another it overlaps and is stacked on
    Given I define css selectors:
        | popup   | #popup   |
        | article | #article |
     Then I see popup over article

  Scenario: A component is not over another it is stacked under
    Given I define css selectors:
        | popup   | #popup   |
        | article | #article |
     Then I see article not over popup

  Scenario: A component is not over another it does not overlap
    Given I define css selectors:
        | popup | #popup |
     Then I see popup not over logo
      And I see logo not over popup
