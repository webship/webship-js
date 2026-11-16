Feature: Iframe step definitions
  As a tester,
  I want to switch to an iframe, act inside it and read its text,
  so that embedded forms and widgets can be tested like the rest of the page.

  Scenario: Switch to an iframe by CSS selector
    Given I am on "/iframe.html"
     When I switch to iframe "#order-frame"
     Then I should see "Order form inside the iframe" inside the iframe
      And I should not see "Newsletter form inside the iframe" inside the iframe

  Scenario: Switch to the iframe by CSS selector, with the article
    Given I am on "/iframe.html"
     When I switch to the iframe ".newsletter-widget"
     Then I should see "Newsletter form inside the iframe" inside the iframe
      And I should not see "Order form inside the iframe" inside the iframe

  Scenario: Switch to an iframe with a locator
    Given I am on "/iframe.html"
     When I switch to iframe with locator "iframe[src*=newsletter]"
     Then I should see "Newsletter form inside the iframe" inside the iframe
      And I should not see "Order form inside the iframe" inside the iframe

  Scenario: Switch to the iframe with a title
    Given I am on "/iframe.html"
     When I switch to the iframe with title "Order form"
     Then I should see "Order form inside the iframe" inside the iframe
      And I should not see "Newsletter form inside the iframe" inside the iframe

  Scenario: Switch to the iframe with a name
    Given I am on "/iframe.html"
     When I switch to the iframe with name "newsletter"
     Then I should see "Newsletter form inside the iframe" inside the iframe
      And I should not see "Order form inside the iframe" inside the iframe

  Scenario: Switch from one iframe to another
    Given I am on "/iframe.html"
     When I switch to the iframe with name "order"
     Then I should see "Order form inside the iframe" inside the iframe
     When I switch to the iframe with title "Newsletter form"
     Then I should see "Newsletter form inside the iframe" inside the iframe
      And I should not see "Order form inside the iframe" inside the iframe

  Scenario: The text of the root document is not inside the iframe
    Given I am on "/iframe.html"
     When I switch to iframe "#order-frame"
     Then I should not see "This text is in the root document" inside the iframe
     When I switch to the root document
     Then I should see "This text is in the root document"

  Scenario: Click a text inside the iframe
    Given I am on "/iframe.html"
     When I switch to iframe "#order-frame"
     Then I should not see "Order confirmed" inside the iframe
     When I click "Confirm" inside the iframe
     Then I should see "Order confirmed" inside the iframe

  Scenario: Click an element by its id inside the iframe
    Given I am on "/iframe.html"
     When I switch to iframe "#order-frame"
      And I click "cancel-btn" by attr inside the iframe
     Then I should see "Order cancelled" inside the iframe
      And I should not see "Order confirmed" inside the iframe

  Scenario: Click an element by its test id inside the iframe
    Given I am on "/iframe.html"
     When I switch to iframe "#order-frame"
      And I click "Confirm" inside the iframe
      And I click "cancel-order" by attr inside the iframe
     Then I should see "Order cancelled" inside the iframe

  Scenario: Fill in a field by its name inside the iframe
    Given I am on "/iframe.html"
     When I switch to the iframe with name "newsletter"
     Then I should not see "Hello Webship" inside the iframe
     When I fill in "subscriber_name" with "Webship" inside the iframe
     Then I should see "Hello Webship" inside the iframe

  Scenario: Fill in a field by its id inside the iframe
    Given I am on "/iframe.html"
     When I switch to the iframe with name "newsletter"
      And I fill in "city" with "Amman" inside the iframe
     Then I should see "City set to Amman" inside the iframe
