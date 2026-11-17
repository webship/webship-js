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
* **Screenshots on failure** — saved to `tests/screenshots/` for instant
  debugging.

## 30-second install

```bash
npm install webship-js --save-dev
```

The post-install script copies a starter `cucumber.js`,
`playwright.config.ts`, and `tests/` skeleton, adds the `test` scripts to
`package.json`, and downloads Chromium into the Playwright cache. If it
reports that the browser was not installed, run:

```bash
npx playwright install chromium
```

When npm skips install scripts (it warns that webship-js has "install
scripts not yet covered by allowScripts", or `--ignore-scripts` is set),
nothing is copied and `npm test` answers `Error: no test specified`. Run
the same scaffold by hand, then let the script run on the next installs:

```bash
npx init-webship-js
npm install-scripts approve webship-js
```

The scaffold never replaces a file or a `test` script the project already
has, with two exceptions: npm's "no test specified" placeholder, and a
`test` script that runs Nightwatch (a project upgraded from webship-js
1.x), which becomes the cucumber-js suite while the old command stays
available as `npm run test:nightwatch`. `npx init-webship-js --force`
rewrites the scaffold's files and scripts, but never
`tests/step-definitions/custom.js`, which holds the project's own steps.

Firefox and WebKit are optional: `npx playwright install firefox webkit`.

## 60-second first test

The skeleton comes with `tests/features/check-homepage.feature`, which
opens the home page of your site. Run it first:

```bash
LAUNCH_URL=https://your-site.example npm test
```

Without `LAUNCH_URL` the suite opens `http://localhost:8080`.

Then:

1. Drop your scenario into `tests/features/smoke.feature`.
2. Run `npm test` again.

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
