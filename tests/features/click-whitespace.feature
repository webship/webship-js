Feature: Links and buttons whose markup puts white space around their text
  As a tester
  I want to click a link and press a button by the text a person reads
  So that the indentation of a template does not hide them from the steps

  Scenario: Click a link whose text sits on a line of its own
    Given I am on "/click-whitespace.html"
    When I click "Products"
    Then the url should match "#products$"

  Scenario: Click a link whose text breaks across lines
    Given I am on "/click-whitespace.html"
    When I click "About us"
    Then the url should match "#about-us$"

  Scenario: Press a button whose label is indented
    Given I am on "/click-whitespace.html"
    When I press "Save draft"
    Then I should see "The draft was saved."

  Scenario: Click a link of a table row whose text is indented
    Given I am on "/click-whitespace.html"
    When I click "Edit" in the "Order 1042" row
    Then the url should match "#order-1042$"

  Scenario: Follow a link whose text sits on a line of its own
    Given I am on "/click-whitespace.html"
    When I follow "Products"
    Then the url should match "#products$"
