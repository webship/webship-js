Feature: A sorted table column is read the way a reader orders it
  The cells are compared as numbers when every cell reads as a number, as
  dates when every cell reads as a date, else as text with letter case
  ignored and the numbers inside the text in number order.

  Scenario: Prices, quantities and dates in ascending order
    Given I am on "/sorted-tables.html"
    Then the table "#prices" should be sorted by "Price" in "ascending" order
    And the table "#prices" should be sorted by "Stock" in "asc" order
    And the table "#prices" should be sorted by "Released" in "ascending" order

  Scenario: Text with letter case ignored
    Given I am on "/sorted-tables.html"
    Then the table "#prices" should be sorted by "Product" in "ascending" order

  Scenario: Numbers inside a text, descending, and equal cells
    Given I am on "/sorted-tables.html"
    Then the table "#items" should be sorted by "Item" in "descending" order
    And the table "#items" should be sorted by "Discount" in "asc" order
