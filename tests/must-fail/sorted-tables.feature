@must-fail
Feature: Sorted-table assertions that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one
  fails at its last step with the message its description announces, the
  address of the page and a hint.

  Scenario: A price column out of order
    Fails with: The table "#unsorted" is not sorted by "Price" in ascending order: row 1 ("$49.99") comes before row 2 ("$9.99").
    Given I am on "/sorted-tables.html"
    Then the table "#unsorted" should be sorted by "Price" in "ascending" order

  Scenario: A column that is not in the table
    Fails with: The table "#prices" has no "Colour" column.
    Given I am on "/sorted-tables.html"
    Then the table "#prices" should be sorted by "Colour" in "ascending" order

  Scenario: A table that is not on the page
    Fails with: No table matches "#no-such-table".
    Given I am on "/sorted-tables.html"
    Then the table "#no-such-table" should be sorted by "Price" in "ascending" order
