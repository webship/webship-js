
# DDEV Webship-JS

## Overview

This add-on integrates "Webship-JS — a Playwright + Cucumber-JS Automated Functional Acceptance Testing framework" into DDEV projects, enabling automated browser testing via Gherkin `.feature` files within the DDEV environment.

## Installation

Execute the command to add and configure the tool:

```
ddev add-on get webship/ddev-webship-js
```

The installation automatically scaffolds required configuration files, creates a starter feature file, installs Playwright browsers, and restarts the DDEV environment.

### Install Dependencies

**Using npm:**
```
ddev npm install
```

**Using yarn:**
```
ddev yarn install
```

## Running Tests

### With npm

```
ddev npm run test:chromium      # Run all tests with Chromium
ddev npm run test:firefox       # Run all tests with Firefox
ddev npm run test:webkit        # Run all tests with WebKit
```

### With yarn

```
ddev yarn test:chromium         # Run all tests with Chromium
ddev yarn test:firefox          # Run all tests with Firefox
ddev yarn test:webkit           # Run all tests with WebKit
```

### Running Specific Tests

```
ddev exec npx cucumber-js --config cucumber.js tests/features/example.feature
ddev exec npx cucumber-js --config cucumber.js tests/features/example.feature:12
```

A feature, or a scenario by the line of its `Scenario:` keyword, named this way runs alone. A `cucumber.js` scaffolded by an earlier release of Webship-js runs the whole suite instead: there, use `ddev exec env FEATURES=tests/features/example.feature npx cucumber-js --config cucumber.js`, or delete `cucumber.js` and write it again with `ddev exec npx init-webship-js --skip-browsers`.
