Feature: Table step definitions

  Scenario: Inspect table content
    Given I am on "/table.html"
     Then the table "#users" should have 3 rows
      And the table "#users" should have 3 columns
      And the table "#users" should not be empty
      And the table "#empty" should be empty
      And the table "#users" should contain the following columns:
        | Name |
        | Role |
        | Status |
      And the table "#users" should be sorted by "Name" in "ascending" order
      And the table "#users" should contain the following rows:
        | Alice | Admin |
      And the "Bob" row should contain the following:
        | User |
        | Active |
