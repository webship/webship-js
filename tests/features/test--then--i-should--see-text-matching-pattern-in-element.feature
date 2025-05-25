Feature: An example of ensuring that a pattern matches the text in a specific element
      As a developer,
      I want to ensure that a pattern matches the text in a specific element.

  Scenario: Ensuring that the text in an element matches the 12-hour time format pattern
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "(((0[1-9])|(1[0-2])):([0-5])(0|5)\s(A|P|a|p)(M|m))" in the ".time" element

  Scenario: Ensuring that the text in an element matches the DD/MM/YYYY or DD-MM-YYYY date format pattern
    Given I am on "/test--then--i-should--see-text-matching-pattern.html"
      And I wait max of 3 seconds
     Then I should see text matching "(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}" in the "#date" element