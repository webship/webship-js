# Webship-js Documentation

Webship-js is a BDD-first browser-automation harness built on Playwright + Cucumber-js. Feature files in plain Gherkin; selectors that survive redesigns; smart waits that never sleep.

## Reading order

### Webship-js essentials (custom)

| Doc | Topic |
| --- | --- |
| [00 Quick start](00-quick-start.md) | 5-minute path for newcomers |
| [01 Getting started](01-getting-started.md) | Install, project layout, run modes |
| [02 BBR smart waits](02-bbr-smart-waits.md) | Why we never `sleep N seconds` |
| [03 Selector registry](03-selector-registry.md) | Named selectors + CMS / framework presets |
| [04 Step reference](04-step-reference.md) | Every built-in step, by topic |
| [05 Web-first assertions](05-web-first-assertions.md) | Auto-retrying matchers |
| [06 Networking & dialogs](06-network-and-dialogs.md) | Request mocking, alerts, prompts |
| [07 Auth state](07-auth-state.md) | Save / restore login |
| [08 Clock mocking](08-clock-mocking.md) | Control time |
| [09 API testing](09-api-testing.md) | Direct HTTP from BDD |
| [10 Accessibility](10-accessibility.md) | POUR smoke checks |
| [11 Debugging](11-debugging.md) | Screenshots, headed, traces, reports |
| [12 AI agent guide](12-ai-agent-guide.md) | Wisdom + recipes from the Recipes book v1.0.30 (TDD AI / SPDD / Three Amigos / golden rules) |
| [13 FAQ](13-faq.md) | Common questions for newcomers |
| [14 Recipes cookbook](14-recipes-cookbook.md) | 20 paste-and-go scenarios |
| [15 Tag conventions](15-tag-conventions.md) | Standard tags + CI lane patterns |

### Reference (mirrored from webship.co/docs/webship-js/2.0.x)

| Doc | Topic |
| --- | --- |
| [Overview](overview.md) | Webship-js v2.0.x at a glance |
| [Install](install-webship-js.md) | Install Webship-js |
| [Install — DDEV](install-webship-js/ddev-webship-js.md) | DDEV-Webship-js variant |
| [Global settings](global-settings.md) | `cucumber.js` `worldParameters` reference |
| [Commands](commands.md) | CLI commands |
| [Assertions](assertions.md) | Built-in assertions |
| [Step definitions](step-definitions.md) | Step-definition catalogue (28 sub-pages under `step-definitions/`) |
| [API step definitions](api-step-definitions.md) | REST step definitions |
| [Advanced screenshots](advanced-screenshots.md) | Per-size, full-page, named (3 sub-pages under `advanced-screenshots/`) |
| [Advanced selectors](advanced-selectors.md) | Named selector registry, position assertions |
| [Diffy step definitions](diffy-step-definitions.md) | Visual-diff workflow (10 sub-pages under `diffy-step-definitions/`) |

## At a glance

```gherkin
Feature: Smoke

  Background:
    Given I restore the auth state from "tests/auth/admin.json"

  @javascript
  Scenario: Dashboard renders without JS errors
    Given I am on "/dashboard"
     And I wait until the network is idle
    Then the page should have a main landmark
     And "<#user-list>" should have a count of 5 within 5 seconds
     And "<.notification>" should not be visible
```

## Source layout

```
webship-js/
├── docs/                       <— You are here
├── tests/
│   ├── features/               <— Your *.feature files
│   ├── selectors/              <— CMS / framework JSON presets
│   └── step-definitions/       <— Built-in steps (auto-loaded)
│       ├── webship.js              # World setup, hooks, shared helpers (smartSettle, modal, selectors)
│       ├── navigation.steps.js     # homepage / paths / history / URL assertions
│       ├── action.steps.js         # press, click, follow, attach
│       ├── form.steps.js           # fill, select, check, radio
│       ├── assertion.steps.js      # see / not see, in row, in element, response, count
│       ├── api.steps.js            # REST API steps
│       ├── screenshot.steps.js     # Screenshot hooks
│       ├── selectors.steps.js      # Named selector registry
│       ├── wait.steps.js           # All wait phrasings (BBR)
│       ├── web-first.steps.js      # Auto-retrying matchers
│       ├── auth.steps.js           # Auth state save/restore
│       ├── clock.steps.js          # Time mocking
│       ├── network.steps.js        # Route stubs / blocks / delays
│       ├── dialog.steps.js         # alert/confirm/prompt
│       ├── a11y.steps.js           # Accessibility smoke checks
│       ├── javascript.steps.js     # JS error tracking
│       ├── element.steps.js        # Element interactions
│       ├── field.steps.js          # Form field assertions
│       ├── cookie.steps.js         # Cookie helpers
│       ├── modal.steps.js          # Modal helpers
│       ├── keyboard.steps.js       # Key press steps
│       ├── link.steps.js           # Link assertions
│       ├── path.steps.js           # URL path assertions
│       ├── response.steps.js       # Response header inspection
│       ├── responsive.steps.js     # Viewport breakpoints
│       ├── table.steps.js          # Table assertions
│       ├── metatag.steps.js        # <meta> assertions
│       ├── iframe.steps.js         # Iframe context steps
│       ├── file-download.steps.js  # Download capture
│       ├── rest.steps.js           # REST helpers
│       └── xml.steps.js            # XML body assertions
├── examples/                   <— Static HTML fixtures
├── cucumber.js                 <— Profiles + worldParameters
└── playwright.config.ts        <— Browser launch + context options
```
