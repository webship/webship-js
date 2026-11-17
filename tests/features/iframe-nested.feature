Feature: Nested iframes, and finding elements and text inside an iframe like on the page
  As a tester,
  I want to switch into an iframe inside an iframe, and to find its fields,
  buttons and text the way the page steps do,
  so that embedded widgets are tested like the rest of the page.

  Scenario: Switch to an iframe inside the iframe that is active
    Given I am on "/iframe-nested.html"
     When I switch to iframe "#outer-frame"
     Then I should see "Text of the outer frame" inside the iframe
     When I switch to iframe "#inner-frame"
     Then I should see "Text of the inner frame" inside the iframe
      And I should not see "Text of the outer frame" inside the iframe

  Scenario: Switch to a nested iframe by its name, and back to the root
    Given I am on "/iframe-nested.html"
     When I switch to the iframe with name "outer"
      And I switch to the iframe with title "Inner frame"
     Then I should see "two levels down" inside the iframe
     When I switch to the root document
     Then I should see "This text is in the root document of the nested example"

  Scenario: Fill a field by its label or its placeholder inside the iframe
    Given I am on "/iframe-nested.html"
     When I switch to iframe "#outer-frame"
      And I switch to iframe "#inner-frame"
      And I fill in "Coupon code" with "SAVE10" inside the iframe
      And I fill in "Gift note" with "Happy birthday" inside the iframe
      And I click "Apply the coupon" by attr inside the iframe
     Then I should see "Coupon SAVE10 applied" inside the iframe

  Scenario: Click an element by its title inside the iframe
    Given I am on "/iframe-nested.html"
     When I switch to iframe "#outer-frame"
      And I switch to iframe "#inner-frame"
      And I click "Remove the coupon" by attr inside the iframe
     Then I should see "Coupon removed" inside the iframe

  Scenario: Text that arrives late inside the iframe
    Given I am on "/iframe-nested.html"
     When I switch to iframe "#outer-frame"
      And I switch to iframe "#inner-frame"
     Then I should see "A late message from the inner frame" inside the iframe
