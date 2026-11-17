Feature: The header row of a selectors table
  As a tester,
  I want to write a selectors table with a header row, as the docs show it,
  so that the header names the columns and is never registered as a selector.

  Scenario: The header row of a CSS selectors table registers no selector
    Given I am on homepage
      And I add "name" selector for "h1" css selector
     When I define css selectors:
      | name       | css selector |
      | table list | ul           |
     Then I see visible name, table list

  Scenario: The header row of an XPath selectors table registers no selector
    Given I am on homepage
      And I add "name" selector for "//h1[1]" xpath selector
     When I define xpath selectors:
      | name          | xpath selector |
      | table xp list | //ul[1]        |
     Then I see visible name, table xp list

  Scenario: The short header row of the hint is a header too
    Given I am on homepage
      And I add "name" selector for "h1" css selector
     When I define css selectors:
      | name          | css |
      | short heading | h3  |
     Then I see visible name, short heading

  Scenario: A table without a header row registers every row
    Given I am on homepage
     When I define css selectors:
      | first row heading | h1 |
      | second row list   | ul |
     Then I see visible first row heading, second row list
