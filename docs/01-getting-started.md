# Getting Started

Webship-js is an automated functional testing harness built on Playwright + Cucumber-js. You write feature files in plain Gherkin; webship-js handles the browser, smart waits, screenshots, reports, and CMS-aware selectors out of the box.

## Install

```bash
npm install webship-js --save-dev
```

The post-install script copies a starter `cucumber.js`, `playwright.config.ts`, and `tests/` skeleton into your project on first install.

## Project layout

```
your-project/
├── cucumber.js                      # Profiles + worldParameters
├── playwright.config.ts             # Browser launch + context options
└── tests/
    ├── features/                    # *.feature files (Gherkin)
    ├── selectors/                   # CMS / framework selector JSON
    └── step-definitions/            # *.js or *.ts (loaded automatically)
```

## TypeScript and JavaScript together

Step definitions can be plain JavaScript (`.js`) or TypeScript (`.ts`) — mix freely in the same project. The default `cucumber.js` registers the [`tsx`](https://tsx.is) require hook, so `.ts` files run with zero build step:

```js
// cucumber.js (default)
requireModule: ['tsx/cjs'],
require: ['tests/step-definitions/**/*.{js,ts}'],
```

Add a TypeScript step alongside JS ones:

```ts
// tests/step-definitions/custom.steps.ts
import { Then } from '@cucumber/cucumber';
import assert from 'node:assert';

Then(/^(I |we )*see a TypeScript step$/, async function (this: { page: import('playwright').Page }) {
  assert.ok(this.page);
});
```

Pure-JS shops can drop both `requireModule` and the `.ts` half of the glob.

## Run the suite

```bash
# Default — full pretty output, optional auto-screenshots on failure.
npm test

# Fast run — no slow-mo.
npm run test:fast

# Watch the browser interactively.
npm run test:headed

# Pick a single browser.
BROWSER=firefox npm test
BROWSER=webkit  npm test

# Parallel + retry (CLI flags — no separate profile needed).
npx cucumber-js --parallel 4 --retry 1 --retry-tag-filter @flaky
```

## Environment variables

| Variable | Default | Effect |
| --- | --- | --- |
| `LAUNCH_URL` | `http://localhost:8080` | Base URL for `Given I am on "/path"` |
| `BROWSER` | `chromium` | `chromium` / `firefox` / `webkit` |
| `HEADLESS` | `true` | Set to `false` for headed mode |
| `SLOW_MO` | `300` headed: `800` | Per-action delay (ms); set `0` for fast runs |
| `WEBSHIP_AUTO_SETTLE` | on | Set to `off` to disable auto edge-wait after actions |

## First feature file

```gherkin
Feature: Smoke

  Scenario: Homepage loads
    Given I am on the homepage
     Then the page should declare a language
      And the page should have exactly one h1
      And there should be no JavaScript errors
```

## Next reading

- [BBR smart waits](02-bbr-smart-waits.md) — why we never `sleep N seconds`.
- [Selector registry](03-selector-registry.md) — named selectors + CMS presets.
- [Step reference](04-step-reference.md) — every built-in step, by topic.
- [Web-first assertions](05-web-first-assertions.md) — auto-retrying matchers.
- [Networking & dialogs](06-network-and-dialogs.md) — mocks, routes, alerts.
- [Auth state](07-auth-state.md) — save / restore login.
- [Clock mocking](08-clock-mocking.md) — control time.
- [API testing](09-api-testing.md) — direct HTTP from BDD.
- [Accessibility](10-accessibility.md) — POUR smoke checks.
- [Debugging](11-debugging.md) — screenshots, headed mode, traces.
