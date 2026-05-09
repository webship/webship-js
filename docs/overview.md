
# Webship JS 2.0.x

Webship-js is an Automated Functional Acceptance Testing tool that streamlines end-to-end testing for web applications. It combines [Playwright](https://playwright.dev/) and [Cucumber-js](https://github.com/cucumber/cucumber-js) with custom step definitions.

## Key Features

**Test Script Creation:** Users can write scenarios mimicking real user interactions:

```gherkin
Feature: Login page
  Scenario: Successful Login with Valid entries
    Given I am on homepage
     When I go to "login.html"
      And I fill in "Username" with "Smith"
      And I fill in "Password" with "1$34"
      And I press "Login"
     Then I should see "Welcome Smith"
```

**Test Execution:** The tool automates test script execution and verifies outcomes against actual results.

**Test Data Management:** Functionality for defining and manipulating input data sets across different test scenarios.

**Reporting and Analysis:** Generates detailed reports with passed/failed cases and exception documentation.

## Benefits

Webship-js offers "increased testing efficiency, reduced human error, improved test coverage, and faster time-to-market."

## Documentation Sub-pages

- [Install Webship JS](/docs/webship-js/2.0.x/install-webship-js)
- [Global Settings](/docs/webship-js/2.0.x/global-settings)
- [Step Definitions](/docs/webship-js/2.0.x/step-definitions)
- [API Step Definitions](/docs/webship-js/2.0.x/api-step-definitions)
- [Advanced Screenshots](/docs/webship-js/2.0.x/advanced-screenshots)
- [Advanced Selectors](/docs/webship-js/2.0.x/advanced-selectors)
- [Diffy Step Definitions](/docs/webship-js/2.0.x/diffy-step-definitions)
- [Assertions](/docs/webship-js/2.0.x/assertions)
- [Commands](/docs/webship-js/2.0.x/commands)
