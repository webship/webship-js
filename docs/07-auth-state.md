# Auth State

Logging in once per scenario adds 1–3 seconds per test. Webship-js uses Playwright's `storageState` API to **save the cookies + localStorage of an authenticated session** and replay it in later scenarios — instant sign-in, no UI flow.

## Save once, restore everywhere

### One-off setup feature

`tests/features/_setup-auth.feature`:

```gherkin
@auth-setup
Feature: Auth state setup

  Scenario: Save admin auth state
    Given I am on "/login"
    When I fill in "admin@example.com" for "Email"
     And I fill in "secret" for "Password"
     And I press "Sign in"
     And I wait until the URL contains "/dashboard"
    Then I save the auth state to "tests/auth/admin.json"
```

Run once:

```bash
npx cucumber-js --tags @auth-setup
```

### Use in regular scenarios

```gherkin
Feature: Admin dashboard

  Background:
    Given I restore the auth state from "tests/auth/admin.json"
     And I am on "/dashboard"

  Scenario: Admin sees user list
    Then "<#user-list>" should be visible
     And "<#user-list>" should have a count of 5 within 5 seconds
```

`I restore the auth state from "..."` swaps the current browser context for a fresh one with the saved cookies/localStorage. The tracker init script is reinstalled automatically so smart waits keep working.

## Clearing auth

```gherkin
Given I clear the auth state
```

Removes cookies and clears `localStorage` / `sessionStorage` on the current page.

## Multiple roles

Save one file per role:

- `tests/auth/admin.json`
- `tests/auth/editor.json`
- `tests/auth/customer.json`

Then pick a role per scenario:

```gherkin
Scenario: Editor cannot delete
  Given I restore the auth state from "tests/auth/editor.json"
  When I am on "/admin/products"
  Then the "Delete" button should not be visible
```

## Caveats

- Session keys signed against IP or User-Agent will reject the restored cookie. Use a longer session lifetime in test environments.
- CSRF tokens stored on form pages need to be re-fetched after restore. Use `Given I am on "/path"` after the restore step.
- Two-factor flows cannot be replayed — keep an environment-specific TOTP bypass behind a feature flag.
