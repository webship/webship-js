# Webship-js Documentation

Webship-js is a BDD-first browser-automation harness built on Playwright + Cucumber-js. Feature files in plain Gherkin; selectors that survive redesigns; smart waits that never sleep.

**411 built-in steps** across **36 step files**. **288 example scenarios / 1,406 step executions** in the bundled suite, all green on chromium, firefox, and webkit.

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
| [16 CI / CD setup](16-ci-cd.md) | Per-provider setup steps and config notes |

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
│   └── step-definitions/                  <— Built-in steps (auto-loaded)
│       ├── webship.js                          # World setup, hooks, shared helpers (smartSettle, modal, selectors, date tokens)
│       ├── a11y.steps.js               (26)   # axe-core audits + WCAG hygiene probes
│       ├── action.steps.js              (7)   # press / click / follow / attach
│       ├── api.steps.js                (22)   # REST long form (base URL, headers, query, body, JSON Pointer)
│       ├── assertion.steps.js          (14)   # see / not see, in row, in element, response, count
│       ├── auth.steps.js                (3)   # save / restore / clear storageState
│       ├── clock.steps.js               (7)   # install / advance / pause / set system time
│       ├── cookie.steps.js             (12)   # cookie exists / equals / contains
│       ├── debug.steps.js               (2)   # print URL / last response (diagnostic)
│       ├── dialog.steps.js              (8)   # native alert / confirm / prompt
│       ├── element.steps.js            (19)   # focus / scroll-to / dispatch / count / position
│       ├── field.steps.js              (27)   # field state, checkbox, radio, select-list
│       ├── file-download.steps.js       (8)   # capture + assert filename / mime / path
│       ├── form.steps.js               (13)   # fill / select / check / uncheck / radio
│       ├── iframe.steps.js             (10)   # frameLocator switch + scoped click / fill / assert
│       ├── input.steps.js               (9)   # hover / drag / dbl / right-click / tap / viewport
│       ├── javascript.steps.js          (4)   # JS error tracker + assertion (warn / fail / off)
│       ├── keyboard.steps.js            (4)   # single key + combos with alias normalisation
│       ├── link.steps.js                (9)   # href / title / target / rel
│       ├── metatag.steps.js             (3)   # description / keywords / OG / Twitter
│       ├── modal.steps.js               (9)   # HTML modal visibility / content / interactions
│       ├── navigation.steps.js         (11)   # homepage / paths / history / URL assertions
│       ├── network.steps.js            (10)   # route stubs / mocks / delays / offline
│       ├── path.steps.js                (8)   # URL path / query / fragment
│       ├── response.steps.js            (4)   # response header inspection
│       ├── responsive.steps.js          (5)   # named breakpoints + explicit viewport
│       ├── rest.steps.js                (5)   # REST short form
│       ├── screenshot.steps.js          (6)   # manual + auto-on-failure + per-step capture
│       ├── scroll.steps.js             (12)   # page + scoped element scroll
│       ├── selectors.steps.js          (22)   # named CSS / XPath registry + 22 CMS / framework presets
│       ├── storage.steps.js             (9)   # local / session storage
│       ├── table.steps.js               (8)   # data-table row / column assertions
│       ├── video.steps.js               (4)   # start / stop / save webm recording
│       ├── wait.steps.js               (21)   # every wait phrasing — all BBR-backed
│       ├── web-first.steps.js          (12)   # auto-retrying matchers (`within N seconds`)
│       ├── xml.steps.js                (20)   # XPath equals / contains / count / attr
│       └── yaml.steps.js               (38)   # multi-doc + types + numerics + JSON Schema + diff
├── examples/                   <— Static HTML fixtures
├── cucumber.js                 <— Profiles + worldParameters
└── playwright.config.ts        <— Browser launch + context options
```
