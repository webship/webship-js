# Quick Start (5 minutes)

Brand new to webship-js? Read this page once. You'll be writing tests in
five minutes.

## What you write

Plain English scenarios. No JavaScript required.

```gherkin
Feature: Sign in

  Scenario: Successful login
    Given I am on "/login"
    When I fill in "Email" with "alice@example.com"
     And I fill in "Password" with "s3cret"
     And I press "Sign in"
    Then I should see "Welcome, Alice"
```

That's a complete test. Every line maps to a built-in step. No setup
code. No selector jargon.

## What you get

* **Real browser** — runs in Chromium, Firefox, or WebKit via Playwright.
* **Automatic smart waits** — every action waits for the page to
  settle. No `sleep` / `wait 5s` needed in the happy path.
* **HTML report** — runs auto-generate `tests/reports/cucumber_report.html`.
* **Screenshots on failure** — saved to `screenshots/` for instant
  debugging.

## 30-second install

```bash
npm install webship-js --save-dev
```

The post-install script copies a starter `cucumber.js`,
`playwright.config.ts`, and `tests/` skeleton.

## 60-second first test

1. Drop your scenario into `tests/features/smoke.feature`.
2. Make sure your dev server is running on `http://localhost:8080`
   (or set `LAUNCH_URL` to point elsewhere).
3. Run:

```bash
npm test
```

If your scenario passes, you're done. If it fails, the Cucumber output
names the step that failed and the expected vs actual.

## Where to go next

| Want to… | Read |
| --- | --- |
| Understand smart waits (no `sleep`) | [02 BBR smart waits](02-bbr-smart-waits.md) |
| Use named selectors instead of long CSS | [03 Selector registry](03-selector-registry.md) |
| See every built-in step | [04 Step reference](04-step-reference.md) |
| Test forms / clicks / modals | [04 Step reference](04-step-reference.md) |
| Mock APIs / dialogs | [06 Networking & dialogs](06-network-and-dialogs.md) |
| Accessibility audits | [10 Accessibility](10-accessibility.md) |
| Use AI to generate tests | [12 AI agent guide](12-ai-agent-guide.md) |
| FAQ | [13 FAQ](13-faq.md) |
| Recipes cookbook | [14 Recipes cookbook](14-recipes-cookbook.md) |

## The mental model

* `Given` — set up the scene (navigate, restore auth, seed data).
* `When` — do something (click, fill, submit).
* `Then` — check what should be true (text visible, URL changed).
* `And` / `But` — continuation. Pick whichever reads naturally.
* `Background:` — steps shared across every scenario in a feature.
* `Scenario Outline:` + `Examples:` — same scenario with different data.

## The golden rule

**Wait for events, not time.** Webship-js does this for you in the
common case. If you ever feel tempted to add `wait 5 seconds` because
something flaked, look for an event-based wait first:

```gherkin
# Bad — slow, brittle.
When I press "Save"
 And I wait 5 seconds
Then I should see "Saved"

# Good — instant when fast, patient when slow.
When I press "Save"
Then I should see "Saved"

# Best when "Save" navigates.
When I press "Save"
 And I wait until the URL contains "/saved"
Then I should see "Saved"
```

That's the entire philosophy. Read [02 BBR smart waits](02-bbr-smart-waits.md)
when you're ready to internalise the details.
