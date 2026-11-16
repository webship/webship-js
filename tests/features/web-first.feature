Feature: Web-first assertions wait for the page
  As a tester,
  I want an assertion that keeps looking until the page reaches the state I name,
  so that I do not have to put a wait between an action and its check.

  Scenario: The state of an element
    Given I am on "/web-first.html"
     Then "#banner" should be visible
      And "#secret" should be hidden
      And "#secret" should be attached
      And "#save" should be disabled
      And "#nickname" should be enabled
      And "#nickname" should be editable

  Scenario: The state an element is not in
    Given I am on "/web-first.html"
     Then "#secret" should not be visible
      And "#banner" should not be hidden
      And "#missing" should not be attached
      And "#save" should not be enabled
      And "#nickname" should not be disabled
      And "#locked" should not be editable

  Scenario: The focused element
    Given I am on "/web-first.html"
     Then "#nickname" should not be focused
     When I focus on the element "#nickname"
     Then "#nickname" should be focused
      And "#locked" should not be focused

  Scenario: A state that arrives a moment after the action
    Given I am on "/web-first.html"
     Then "#save" should be disabled
     When I press "Unlock saving"
     Then "#save" should be enabled within 5 seconds
      And "#save" should not be disabled within 5 seconds

  Scenario: An element inside and outside the viewport
    Given I am on "/web-first.html"
     Then "#banner" should be in the viewport
      And "#footer-note" should not be in the viewport
     When I scroll to the element "#footer-note"
     Then "#footer-note" should be in the viewport within 3 seconds
      And "#banner" should not be in the viewport within 3 seconds

  Scenario: The number of elements that match
    Given I am on "/web-first.html"
     Then ".item" should have a count of 3
      And "#missing" should have a count of 0
     When I press "Add item"
     Then ".item" should have a count of 4 within 5 seconds

  Scenario: The value of a field
    Given I am on "/web-first.html"
     Then "#nickname" should have value "webship"
      And "#locked" should have value "read only"
     When I fill in the field "#nickname" with "automation"
     Then "#nickname" should have value "automation" within 3 seconds

  Scenario: An attribute and a class
    Given I am on "/web-first.html"
     Then "#tab-overview" should have attribute "aria-selected" with value "true"
      And "#tab-overview" should have class "is-active"
      And "#tab-details" should have attribute "aria-selected" with value "false"
      And "#about-link" should have attribute "href" with value "about-us.html"

  Scenario: Click a tab by its role and name
    Given I am on "/web-first.html"
     Then the "Details" tab should be visible
     When I click the "Details" tab
     Then "#tab-details" should have attribute "aria-selected" with value "true" within 3 seconds
      And "#tab-details" should have class "is-active" within 3 seconds
      And "#tab-overview" should have attribute "aria-selected" with value "false"
      And "#panel" should have text "Details panel"

  Scenario: Click buttons by their role and name
    Given I am on "/web-first.html"
     Then the "Unlock saving" button should be visible
      And the "Save changes" button should be visible within 3 seconds
     When I click the "Unlock saving" button
     Then "#save" should be enabled
     When we click the "Save changes" button
     Then "#status" should have text "Saved"

  Scenario: Click a link by its role and name
    Given I am on "/web-first.html"
     Then the "About Us" link should be visible
     When I click the "About Us" link
     Then I should be on "/about-us.html"

  Scenario: Click a checkbox and a radio by their role and name
    Given I am on "/web-first.html"
     Then the "Subscribe" checkbox should be visible
      And the "Premium" radio should be visible
      And the "#subscribe" checkbox is not checked
     When I click the "Subscribe" checkbox
     Then the "#subscribe" checkbox is checked
     When I click the "Premium" radio
     Then "#choice" should have text "Plan: premium"
      And the radio button "#plan-premium" should be selected
