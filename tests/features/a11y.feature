Feature: Accessibility (a11y) smoke checks

  Scenario: Page-level landmarks and language
    Given I am on "/a11y.html"
     Then the page should declare a language
      And the page language should be "en"
      And the page should have a main landmark
      And the page should have a navigation landmark
      And the page should have exactly one h1

  Scenario: Image alt text and form labels
    Given I am on "/a11y.html"
     Then every image should have an alt attribute
      And every form field should have an accessible label

  Scenario: Focused element assertions
    Given I am on "/a11y.html"
     When I focus on the element "#email"
     Then the focused element should match "#email"
      And the focused element should be labeled "Email"

  Scenario: WCAG hygiene checks (custom probes)
    Given I am on "/a11y.html"
     Then the page should have a title
      And user zoom should be allowed
      And the heading hierarchy should be valid
      And every button should have an accessible name
      And every link should have an accessible name
      And no element should have a positive tabindex
      And every ARIA reference should resolve
      And every ARIA role should be valid
      And required fields should be consistently marked

  Scenario: axe-core full WCAG audit
    Given I am on "/a11y.html"
     Then the page should have no critical accessibility violations
      And the page should not violate the accessibility rule "image-alt"
      And the page should not violate the accessibility rule "label"
      And the page should pass the accessibility rules "image-alt, label, button-name"
