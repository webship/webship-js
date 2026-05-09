# Networking & Dialogs

Webship-js makes it easy to stub external dependencies, simulate offline / slow networks, and respond to native browser dialogs from within a feature file.

## Stubbing requests

```gherkin
Scenario: Dashboard renders mocked data
  Given I am on the homepage
   And the URL "**/api/users" returns the JSON:
       """
       {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
       """
  When I go to "/dashboard"
   And I wait for AJAX to finish
  Then "<#user-list>" should contain text "Alice"
```

Patterns use Playwright `page.route()` matching: `**/path`, `*.gif`, regex inside CSS.

## Simulating failure

```gherkin
Given the URL "**/api/login" returns status 401 with body "Unauthorized"
Given the URL "**/analytics.js" is blocked
Given the URL "**/api/**" is delayed by 1500 ms
Given the network is offline
Given the network is online
```

## Recording requests

```gherkin
Given I start recording network requests
When I click "Buy now"
Then a POST request to "**/api/checkout" should have been made
 And no request to "**/tracking" should have been made
```

The matcher converts `*` to `.*` so URL patterns stay BDD-friendly.

## Browser dialogs

Native `alert`/`confirm`/`prompt` dialogs block tests until handled. Attach a handler **before** the action that triggers the dialog:

```gherkin
Given I will accept the next dialog
When I click "Delete"
Then the last dialog message should contain "Are you sure"

Given I will dismiss the next dialog
When I click "Leave page"

Given I will accept the next dialog with "user@example.com"
When I click "Reset password"
Then the last dialog type should be "prompt"
```

The most recent dialog is captured on `this._lastDialog` for inspection inside custom step definitions.

For scenarios that trigger many confirmation dialogs in a row, use a persistent handler instead of a single-shot `will accept the next dialog`:

```gherkin
Given I accept all confirmation dialogs
# … many clicks that each fire a confirm() …
Given I do not accept any confirmation dialogs
```

When recording requests you can match either any method or a specific verb:

```gherkin
Then a request to "**/api/users" should have been made
 And a GET request to "**/api/users" should have been made
```

## When to stub vs hit a real backend

| Stub | Real backend |
| --- | --- |
| Third-party APIs (payments, mail, maps) | Your own happy-path flows |
| Slow/flaky external services | Schema validation tests |
| Edge cases (5xx, timeouts, malformed JSON) | End-to-end smoke tests |
| Tests run without internet | Pre-production smoke |
