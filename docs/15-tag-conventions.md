# Tag Conventions

Tags drive what runs in CI, what gets retried, what's currently broken.
Keep them consistent across the suite.

## Standard tags

| Tag | Meaning |
| --- | --- |
| `@critical` | Must pass on every PR. Smoke set. Run with `--tags "@critical"` first in CI. |
| `@smoke` | Synonym for `@critical` when feature owners prefer it. Pick one and stick with it. |
| `@auth` | Touches authentication / sessions. |
| `@security` | Asserts a Safeguard (CSRF, rate limit, token expiry). |
| `@a11y` | Accessibility check (axe-core, focus order, ARIA). Run with `--tags "@a11y"` to gate the a11y suite. |
| `@i18n` | Multi-locale check (Arabic / RTL / French / etc). |
| `@perf` | Performance budget (page load, request count). |
| `@flaky` | Known-unstable. CI retries it once via `--retry` + `--retryTagFilter "@flaky"`. **Never** ship long-term `@flaky` — fix the root cause. |
| `@wip` | Work in progress. CI excludes with `--tags "not @wip"`. |
| `@desktop` / `@mobile` | Viewport-locked variants. |
| `@external` | Hits a third-party service. Skip in offline test runs. |
| `@auth-setup` | One-shot scenarios that produce auth state files. Run manually after credential rotation. |

## How to apply

Tags go on `Feature:` (apply to every scenario) or on a single
`Scenario:`.

```gherkin
@auth
Feature: Sign in

  @critical
  Scenario: Successful login
    Given I am on "/login"
    ...

  @flaky
  Scenario: Concurrent login from two devices
    ...

  @wip
  Scenario: Sign in with Apple
    ...
```

## Recommended CI lanes

```bash
# Smoke gate — every PR.
npx cucumber-js --tags "@critical and not @wip"

# Full suite — main branch / nightly.
npx cucumber-js --tags "not @wip and not @auth-setup"

# Accessibility lane.
npx cucumber-js --tags "@a11y"

# Flaky lane — separate report, allowed to fail without blocking.
npx cucumber-js --tags "@flaky" --retry 2

# Pre-release security gate.
npx cucumber-js --tags "@security or @auth"
```

## Tag hygiene rules

1. **No `@skip`.** If a scenario should not run, fix it or delete it.
   `@wip` is a temporary excuse, not a bin.
2. **`@flaky` is a debt marker.** Each `@flaky` should have an open
   issue. Removing the tag is part of the fix.
3. **Don't tag what's obvious.** Every scenario in `auth.feature`
   doesn't need `@auth` — tag the file.
4. **One source of truth.** Don't invent project-specific synonyms
   (`@blocker`, `@must-pass`, `@p0`). Pick `@critical` and stick with it.
5. **Document custom tags.** If your project needs a tag not in this
   list, add a row to this page.
