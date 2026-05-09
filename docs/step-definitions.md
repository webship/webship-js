
# Step Definitions

Step definitions serve as a critical connector in automated testing frameworks employing behavior-driven development (BDD) or test-driven development (TDD) methodologies. They function as "the bridge between the test scenarios or feature files written in a human-readable format and the actual implementation code."

## Example Feature

```
Feature: Example test for "Then I should be on 'page'"
  As a tester
  I want to be sure I am on "page"

  Scenario: Check "Then I should be on the 'page'" step definition
    Given I am on the homepage
     When I follow "About Us"
     Then I should be on "about-us.html"
     When I move backward one page
     Then I should be on "/"
```

## Available Step Definition Sub-pages

- [Given I am on homepage](/docs/webship-js/2.0.x/step-definitions/given-i-am-homepage)
- [Given I am on "specific" page](/docs/webship-js/2.0.x/step-definitions/given-i-am-specific-page)
- [When I go to the homepage](/docs/webship-js/2.0.x/step-definitions/when-i-go-homepage)
- [Given I am an anonymous user](/docs/webship-js/2.0.x/step-definitions/given-i-am-anonymous-user)
- [When I go to "specific page"](/docs/webship-js/2.0.x/step-definitions/when-i-go-specific-page)
- [When I reload the page](/docs/webship-js/2.0.x/step-definitions/when-i-reload-page)
- [When I move backward one page](/docs/webship-js/2.0.x/step-definitions/when-i-move-backward-one-page)
- [When I move forward one page](/docs/webship-js/2.0.x/step-definitions/when-i-move-forward-one-page)
- [When I fill in](/docs/webship-js/2.0.x/step-definitions/when-i-fill)
- [When I press "button"](/docs/webship-js/2.0.x/step-definitions/when-i-press-button)
- [When I click "link"](/docs/webship-js/2.0.x/step-definitions/when-i-click-link)
- [When I check "checkbox"](/docs/webship-js/2.0.x/step-definitions/when-i-check-checkbox)
- [When I uncheck "checkbox"](/docs/webship-js/2.0.x/step-definitions/when-i-uncheck-checkbox)
- [When I select "option" from "select list"](/docs/webship-js/2.0.x/step-definitions/when-i-select-option-select-list)
- [When I click "operation" in "text" row](/docs/webship-js/2.0.x/step-definitions/when-i-click-operation-text-row)
- [When I wait](/docs/webship-js/2.0.x/step-definitions/when-i-wait)
- [Then I should see](/docs/webship-js/2.0.x/step-definitions/then-i-should-see)
- [Then I should be](/docs/webship-js/2.0.x/step-definitions/then-i-should-be)
- [Then the "item" checkbox](/docs/webship-js/2.0.x/step-definitions/then-item-checkbox)
- [Then the item should contain](/docs/webship-js/2.0.x/step-definitions/then-item-should-contain)
- [Then the "item" link should contain "url"](/docs/webship-js/2.0.x/step-definitions/then-item-link-should-contain-url)
- [Then the "value" radio button is selected](/docs/webship-js/2.0.x/step-definitions/then-value-radio-button-selected)
- [Then the radio button "value" should be selected](/docs/webship-js/2.0.x/step-definitions/then-radio-button-value-should-be-selected)
- [Then the response status code should be {number}](/docs/webship-js/2.0.x/step-definitions/then-response-status-code-should-be-number)
- [When I attach the file "file name" to "element"](/docs/webship-js/2.0.x/step-definitions/when-i-attach-file-file-name-element)
- [When I scroll](/docs/webship-js/2.0.x/step-definitions/when-i-scroll)
- [When I select radio button "value"](/docs/webship-js/2.0.x/step-definitions/when-i-select-radio-button-value)
- [When I wait for AJAX to finish](/docs/webship-js/2.0.x/step-definitions/when-i-wait-ajax-finish)
