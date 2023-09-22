Feature: An example of testing match a pattern to text in a specific element
  As a developer
  I want to be able to check if I can see text matching the pattern I require in a specific element.

Scenario: Check if text exist in an element has a pattern match with 12-hour time format
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P|a|p)(M|m))" in the ".time" element

Scenario: Check if text exist in an element has a pattern not match with date YYYY-MM-DD
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should not see text matching "\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])" in the "#date" element

Scenario: Check if text exist in an element has a pattern match with date DD/MM/YYYY or DD-MM-YYYY
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element