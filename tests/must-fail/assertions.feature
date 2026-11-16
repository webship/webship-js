@must-fail
Feature: Assertions that must fail, and what they say
  Every scenario asserts something that is not true on the example pages.
  tests/check-must-fail.js runs them and checks that each one fails at its
  last step with the message its description announces, the address of the
  page and a hint.

  Scenario: A text that is not on the page
    Fails with: The text "Completely different words" was not found on the page after 5 seconds.
    Given I am on "/about-us.html"
    Then I should see "Completely different words"

  Scenario: A text that is on the page
    Fails with: The text "Paragraph example" is on the page, but it should not be.
    Given I am on "/about-us.html"
    Then I should not see "Paragraph example"

  Scenario: No text matches a pattern
    Fails with: No text of the page matches "\d{4}-\d{2}-\d{2}".
    Given I am on "/about-us.html"
    Then I should see text matching "\d{4}-\d{2}-\d{2}"

  Scenario: An element that is not on the page
    Fails with: No element with the text or the label "No such label" was found after 3 seconds.
    Given I am on "/about-us.html"
    Then I should see a "No such label" element

  Scenario: An element that is not on the page, by attribute
    Fails with: No element with "no-such-element-here" was found after 3 seconds.
    Given I am on "/about-us.html"
    Then I should see a "no-such-element-here" element by attr

  Scenario: An element that is on the page, by attribute
    Fails with: An element with "paragraphid" is on the page, but it should not be.
    Given I am on "/about-us.html"
    Then I should not see a "paragraphid" element by attr

  Scenario: A wrong text in an element
    Fails with: The element "h1" does not contain "Completely different words".
    Given I am on "/about-us.html"
    Then I should see "Completely different words" in the "h1" element

  Scenario: A text in an element that is not on the page
    Fails with: The element "#no-such-element-here" was not found on the page after 5 seconds.
    Given I am on "/about-us.html"
    Then I should see "About Us" in the "#no-such-element-here" element

  Scenario: A wrong text in an element, by attribute
    Fails with: The element with "paragraphid" does not contain "Completely different words".
    Given I am on "/about-us.html"
    Then I should see "Completely different words" in the "paragraphid" element by attr

  Scenario: A text of an element that does not match a pattern
    Fails with: The text of the element "h1" does not match "^Contact".
    Given I am on "/about-us.html"
    Then I should see text matching "^Contact" in the "h1" element

  Scenario: A wrong text in a table row
    Fails with: The "Alice" row does not contain "Pending".
    Given I am on "/table.html"
    Then I should see "Pending" in the "Alice" row

  Scenario: A table row that is not there
    Fails with: No table row contains "Zoe"
    Given I am on "/table.html"
    Then I should see "Active" in the "Zoe" row

  Scenario: A wrong number of elements
    Fails with: Expected 7 "#users tbody tr" element(s), got 3.
    Given I am on "/table.html"
    Then I should see 7 "#users tbody tr" elements

  Scenario: A wrong CSS value
    Fails with: The element "paragraphid" does not have the CSS "display: none".
    Given I am on "/about-us.html"
    Then the "paragraphid" element should contain "display: none"

  Scenario: A link that leads somewhere else
    Fails with: The address of the link "Contact" does not contain "/pricing".
    Given I am on "/links.html"
    Then the "Contact" link should contain "/pricing"

  Scenario: A link that is not on the page
    Fails with: No visible link with the text "Pricing" was found after 5 seconds.
    Given I am on "/links.html"
    Then the "Pricing" link should contain "/pricing"

  Scenario: A wrong response status code
    Fails with: Expected the response status code 404, got 200.
    Given I am on "/about-us.html"
    Then the response status code should be 404

  Scenario: A response that does not contain a text
    Fails with: The response does not contain "Completely different words".
    Given I am on "/about-us.html"
    Then the response should contain "Completely different words"
