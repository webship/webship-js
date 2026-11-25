# FAQ

Common questions for newcomers.

## How is webship-js different from raw Playwright?

Playwright is a browser-automation library. Webship-js is a **BDD layer on
top of Playwright + Cucumber-js** with:

* 280+ pre-built Gherkin steps (so you write English, not JavaScript).
* BBR-style smart waits (no `sleep`).
* Named selector registry (`primary button` instead of
  `button.btn-primary[type=submit]`).
* CMS / framework selector presets (Drupal, WordPress, Bootstrap, …).
* Auto-screenshot on failure, auto-HTML-report after every run.

You still get every Playwright primitive when you need it — `this.page`
inside any custom step is a real Playwright Page.

## Do I need to write JavaScript?

For most tests, no. Use the built-in steps. Write JavaScript only when
your business has a step that no preset covers — and even then, place
it in `tests/step-definitions/<topic>.steps.js`, not in feature files.

## My own step is reported as ambiguous. Why?

A step of the selector registry takes registered names without quotes:
`When I click primary button`, `Then I see visible header`. It matches
any unquoted words after its verb, so a custom step such as
`When I click next button in tour` matches it too. Quote the argument and
give the step words of its own (`When I click "Next" in the tour`), or
start it with other words. See
[Bare names and your own steps](03-selector-registry.md#bare-names-and-your-own-steps).

## Can I load several step packs in one project?

Yes, in two ways.

**Packs for one site, in one profile.** `@webship-js/drupal-cms-steps`
brings `@webship-js/drupal-core-steps` along, and
`@webship-js/diffy-steps` (visual comparison) goes beside any pack: no step
of these combinations is ambiguous and their hooks leave each other alone.
`npm run test:packs` checks it against every pack on npm.

**Packs for two sites, one profile each.** The platform packs share their
phrases on purpose: `Given I am a logged in user with the "admin" user`,
`When I log out` and `Then I should see the success message "Saved"` are
steps of the Drupal, WordPress, Joomla, TYPO3, Odoo and django CMS packs
alike, so a feature reads the same on every platform. Two such packs in one
profile make those steps ambiguous, and each pack works against the one
`launchUrl` and the one `users` registry of its profile anyway. A project
that tests two systems, a CMS and its Jira or a store and its blog, gives
each one a profile of its own in `cucumber.js`:

```js
const core = 'node_modules/webship-js/tests/step-definitions/**/*.js';
const shared = {
  requireModule: ['tsx/cjs'],
  format: ['@cucumber/pretty-formatter', 'json:tests/reports/cucumber_report.json'],
};

module.exports = {
  // npx cucumber-js: the Drupal CMS site, with visual comparison.
  default: {
    ...shared,
    require: [
      core,
      'node_modules/@webship-js/drupal-cms-steps/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/diffy-steps/tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/site/**/*.feature'],
    worldParameters: {
      launchUrl: process.env.SITE_URL || 'https://site.example',
      users: { admin: { username: 'admin', password: process.env.SITE_ADMIN_PASSWORD } },
    },
  },
  // npx cucumber-js -p jira: the Jira site of the same team.
  jira: {
    ...shared,
    require: [core, 'node_modules/@webship-js/jira-steps/tests/step-definitions/*.js'],
    paths: ['tests/features/jira/**/*.feature'],
    worldParameters: {
      launchUrl: process.env.JIRA_URL || 'https://jira.example',
      users: { admin: { username: 'admin', password: process.env.JIRA_ADMIN_PASSWORD } },
    },
  },
};
```

`npx cucumber-js -p jira --dry-run` checks one profile without a browser.

## How does a custom step that changes the page wait?

Call `this.smartSettle()` at its end. It runs the same smart wait the
built-in action steps run (no request in flight, no pending timer, a DOM
quiet for 250 ms), for at most 1.5 seconds, or for the budget you pass in
milliseconds:

```js
const { When } = require('@cucumber/cucumber');

When('I add {string} to the cart', async function (item) {
  await this.page.click(`[data-add="${item}"]`);
  await this.smartSettle();
});
```

## How do I add my own helpers to the World?

Extend the World of webship-js instead of replacing it: the smart waits,
the `@mobile` / `@desktop` viewport, video recording and the JavaScript-error
capture all live in it.

```js
const { setWorldConstructor } = require('@cucumber/cucumber');
const { PlaywrightWorld } = require('webship-js/tests/step-definitions/webship');

class ProjectWorld extends PlaywrightWorld {
  async signIn(user) {
    await this.page.goto(`${this.launchUrl}/user/login`);
    // …
  }
}

setWorldConstructor(ProjectWorld);
```

A World set with `setWorldConstructor` that does not extend
`PlaywrightWorld` keeps none of that; webship-js says so once at the start
of the run.

## Why no `wait 5 seconds` in the example tests?

Webship-js installs a smart-settle hook that runs after every
state-changing step. The hook waits for: DOM ready, no in-flight
fetch/XHR, no pending `setTimeout`, and a 250 ms DOM-quiet window. That
covers the cases that historically needed manual sleeps. Read
[BBR smart waits](02-bbr-smart-waits.md) for the full story.

## My test passes locally but fails in CI. Help.

Common causes, in order of likelihood:

1. **Race condition** — replace `wait Ns` with an edge wait
   (`wait until the URL contains "..."`,
   `wait for ".success" to appear`, web-first matcher with
   `within N seconds`).
2. **Different viewport** — CI defaults differ. Pin a breakpoint:
   `Given I set the viewport to the "desktop" breakpoint`.
3. **Different browser** — set `BROWSER=firefox npm test` locally to
   reproduce.
4. **CI is slower** — bump the budget on smart waits explicitly,
   `Then "<#dashboard>" should be visible within 15 seconds`.
5. **Auth state expired** — re-run the auth-setup feature.

## How do I see what the browser is doing?

```bash
npm run test:headed        # opens a real browser, slow-mo 800ms
HEADLESS=false npm test    # same, default slow-mo
```

Failed scenarios save a PNG under `screenshots/failed_*.png`. The
filename embeds the feature, scenario line, and timestamp. The same
picture is attached to the failed step in the JSON report, so the HTML
report shows it under that step.

## How do I run a single feature / scenario?

```bash
# One feature.
npx cucumber-js tests/features/login.feature

# One scenario, by the line of its Scenario: keyword.
npx cucumber-js tests/features/login.feature:12

# One scenario by name match.
npx cucumber-js --name "Successful login"

# Tagged scenarios.
npx cucumber-js --tags "@critical"
npx cucumber-js --tags "@critical and not @flaky"
```

## How do I skip a scenario without deleting it?

Tag it `@wip` and run with `--tags "not @wip"`. Or use a `Cucumber`
disabled step prefix (`Skip:` is not standard; tags are).

## How do I share setup between scenarios?

```gherkin
Feature: Admin dashboard

  Background:
    Given I restore the auth state from "tests/auth/admin.json"
     And I am on "/admin"

  Scenario: Lists users
    Then I should see "Users"

  Scenario: Lists products
    When I follow "Products"
    Then I should see "Products"
```

The `Background:` block runs before every scenario in the file. Keep
it short — 3-5 lines.

## How do I parameterise a scenario?

```gherkin
Scenario Outline: Login fails with bad input
  Given I am on "/login"
  When I fill in "Email" with "<email>"
   And I fill in "Password" with "<password>"
   And I press "Sign in"
  Then I should see "<error>"

  Examples:
    | email           | password | error                      |
    | not-an-email    | secret   | Email is not valid         |
    |                 | secret   | Email is required          |
    | a@b.c           |          | Password is required       |
```

Each row becomes a separate scenario.

## How do I assert what the user sees, not the implementation?

Avoid:

```gherkin
Then the database should have a row in users    # ❌ implementation
```

Prefer:

```gherkin
Then I should see "Welcome, Alice"               # ✅ user behaviour
 And the URL should be "/dashboard"
```

Behaviour-tested code is refactor-friendly. Implementation-tested code
breaks every time the schema changes.

## Does `I should see` care about letter case or hidden text?

No, and `I should not see` and `eventually I should see` read the page the same way: letter case is ignored, white space is collapsed, and the text of hidden elements counts (the text of `<script>` and `<style>` does not). On a page that reads "Next page", `I should see "next page"` passes and `I should not see "next page"` fails. For the text a visitor can see, with its letter case, use `I wait for the text "Next page" to appear`; for an element, `"<selector>" should be visible`.

## How do I name selectors I'll reuse?

In `tests/selectors/my-app.json`:

```json
{
  "css": {
    "primary cta": "main .hero button.cta-primary"
  }
}
```

Wire it in `cucumber.js`:

```js
worldParameters: {
  selectors: { files: ['my-app.json'] }
}
```

Then in features:

```gherkin
When I add "primary cta" selector for "main .hero button.cta-primary" css selector
# (or skip the inline registration since the JSON file is loaded)
Then I see visible primary cta
```

Better yet, use a CMS preset that already names the common parts —
see [03 Selector registry](03-selector-registry.md).

## How do I mock an external API?

```gherkin
Given the URL "**/api/users" returns the JSON:
  """
  {"users": [{"id": 1, "name": "Alice"}]}
  """
When I am on "/users"
Then "<#user-list>" should have a count of 1 within 5 seconds
```

Full reference: [06 Networking & dialogs](06-network-and-dialogs.md).

## How do I test as a logged-in user without retyping the login?

One-time setup feature saves the session. Every other feature restores it.

```gherkin
@auth-setup
Scenario: Save admin auth state
  Given I am on "/login"
  When I fill in "Email" with "admin@example.com"
   And I fill in "Password" with "..."
   And I press "Sign in"
   And I wait until the URL contains "/dashboard"
  Then I save the auth state to "tests/auth/admin.json"
```

Run once: `npx cucumber-js --tags @auth-setup`.

In every other feature:

```gherkin
Background:
  Given I restore the auth state from "tests/auth/admin.json"
```

Saves 1-3 seconds per scenario. Full reference: [07 Auth state](07-auth-state.md).

## How do I run accessibility audits?

```gherkin
Scenario: Page passes WCAG AA
  Given I am on "/checkout"
  Then the page should pass an accessibility audit at level "AA"
```

Layered approach in [10 Accessibility](10-accessibility.md). Combine
custom probes (heading order, skip link, ARIA validity) with axe-core
full audits.

## Does a passing run mean the HTTPS certificate is valid?

No. The scaffold's `playwright.config.ts` opens every browser context with
`ignoreHTTPSErrors: true` and Chromium with `--ignore-certificate-errors`,
so a local site with a self-signed certificate can be tested. The same
settings open a page served with an expired, self-signed or wrong-host
certificate as if the certificate were valid, and the API and REST steps
follow them too: a smoke test of a site passes on a broken certificate.

To check the certificate, set `ignoreHTTPSErrors: false` in
`contextOptions` and remove `--ignore-certificate-errors` from the
Chromium arguments (in a copy of the project kept for that check, if the
rest of the suite runs against local sites). The first navigation to a page
with a bad certificate then fails (`net::ERR_CERT_…`).

## Why does a form answer 403 in the suite and not in a browser?

The project's `playwright.config.ts` likely starts Chromium with
`--disable-web-security`: the scaffold of webship-js 2.0.17 and older wrote
it, and a project keeps its own config. The flag turns off the same-origin
policy, and Chromium then sends a form posted with `fetch` to its own site
without its `Origin` header. A site that checks the origin of a form refuses
it: SvelteKit's form actions answer 403 "Cross-site POST form submissions are
forbidden", for example. Remove `'--disable-web-security'` from
`chromiumArgs`. The iframe steps reach a frame from another origin without
it.

## How do I make CI fast?

```bash
SLOW_MO=0 npx cucumber-js --parallel 4 --retry 1 --retry-tag-filter @flaky
```

Set `--parallel 4` (or however many cores) to fan scenarios across
processes. Each scenario gets its own browser context — no shared
state, safe to parallelise.

## I want AI to write tests for me.

Read [12 AI agent guide](12-ai-agent-guide.md) and follow the
Test-Drive-Develop loop: human writes the feature file (the
specification), AI implements code, tests verify. The webship-js
suite is the validation layer that prevents AI from "looking right"
while doing the wrong thing.

For a structured prompt template, see Recipe AI-1 in that page.
