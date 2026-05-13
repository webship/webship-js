# CLAUDE.md — webship-js project rules for AI agents

This file is the durable contract between human maintainers of webship-js and
any AI coding assistant working on the repository. Read it in full before
making changes. Follow it to the letter — these rules emerged from real
sessions and reflect strong preferences.

## 0. Identity

webship-js is a BDD-first browser automation harness built on
**Playwright + Cucumber-js**. It is its own product. It is **NOT** Behat,
DrevOps, Drupal, or PHP. Code, file names, comments, and step phrasings
must never reference those tools or imply that webship-js was ported from
them. Treat webship-js as the source of truth.

## 1. Communication & change rules

1. **Never commit on the user's behalf.** The user always invokes git
   commits manually. AI work stays uncommitted unless asked.
2. **Pause for irreversible operations.** Never `rm -rf`, `git push --force`,
   `npm publish`, or anything that affects shared state without explicit
   confirmation in the same turn.
3. **Caveman mode.** When the user has caveman mode active, drop articles,
   filler, and pleasantries in chat replies. Code, commits, security notes,
   and documentation always stay normal English.
4. **Update docs with every change.** When you add, rename, remove, or
   restructure a step / selector / configuration option, update the matching
   page under `docs/` in the same turn. Specifically:
   * New / removed step → update `docs/04-step-reference.md`.
   * New step file → add it to the source layout block in `docs/README.md`.
   * Topic-level addition (auth, network, clock, …) → add or refresh the
     dedicated page (`docs/07-auth-state.md`, `docs/06-network-and-dialogs.md`,
     etc.).
   * Selector preset added under `tests/selectors/` → add to the table in
     `docs/03-selector-registry.md`.
5. **Backups.** When the user says "backup" or asks for a versioned zip,
   bump the patch version in `package.json` and produce
   `/var/www/html/products/webship-js-<version>.zip`. Excludes:
   `node_modules/`, `tests/reports/`, `screenshots/`, `.git/`.

## 2. Step definition rules

### 2.1 Phrasing

* Every step MUST support the pronoun prefix `(I |we )*`. Use a regex
  pattern, not a Cucumber Expression with `'I ...'`, for any step where the
  user could plausibly say "I" or "we".
* Use plain English in the user-visible step text. Avoid camelCase. Examples:
  * `local storage` — NOT `localStorage`
  * `session storage` — NOT `sessionStorage`
* Keep technical identifiers (CSS selectors, JSON Pointer paths, header
  names) verbatim — they are domain language, not prose.
* Never reference Behat, DrevOps, Drupal, PHP, or webship.co versioned
  product names in step phrasings or examples. Use neutral placeholders
  (`example`, `Sample title`, `test-runner`).

### 2.2 JSDoc block — required for every step

Every step definition MUST be preceded by a JSDoc block with:

* A short description of what the step asserts or does.
* Implementation notes only when the WHY is non-obvious (e.g. "uses
  Playwright's networkidle plus a custom AJAX counter so late-firing
  setTimeout callbacks re-arm the wait").
* **At least 5 `Example #N:` lines** of valid Gherkin that match the step
  pattern. Multi-line examples are permitted (continuation lines are
  context — only the example header line needs to match the pattern).
* Examples MUST use real, plausible data — no escaped JSON inside `"..."`
  strings unless the step accepts a doc string. Avoid quotes-within-quotes
  Gherkin in examples.

There is an audit script (`/tmp/audit-examples.js`) used during sessions to
verify every example matches its step pattern. Keep mismatches at zero.

### 2.3 No duplicate logic

Before adding a step, search existing files. Identical Playwright calls
under different phrasings ARE allowed when the phrasings target different
audiences (e.g. `I hover over "X"` versus `I hover over the element "X"`).
True duplicate logic — same code, same conceptual scope — must be merged
or deleted.

### 2.4 Do NOT merge

Some pairs look similar but cover different domains. NEVER merge:

| File | Domain |
| --- | --- |
| `modal.steps.js` | HTML modal overlays (`role="dialog"`, `.modal`) |
| `dialog.steps.js` | Native browser dialogs (alert / confirm / prompt) |
| `field.steps.js` | Input field interactions (CSS selector based) |
| `form.steps.js` | Form-level fills via label / placeholder / name |
| `assertion.steps.js` | Page-level text + element assertions |
| `web-first.steps.js` | Auto-retrying matchers (Playwright web-first style) |

## 3. File organisation

```
tests/step-definitions/
├── webship.js              # World, hooks, init script, shared helpers (smartSettle, modal probes, buildSelector, …). Exports → require('./webship') from any *.steps.js.
├── navigation.steps.js     # Anonymous user, homepage, paths, history, URL/path assertions.
├── action.steps.js         # press / click / follow / attach file.
├── form.steps.js           # fill / select / additionally select / check / uncheck / radio.
├── assertion.steps.js      # see / not see, in row, in element, response, count.
├── field.steps.js          # field / checkbox / radio / select state assertions.
├── modal.steps.js          # HTML modal visibility / content / interactions.
├── wait.steps.js           # ALL wait phrasings (BBR — see §4).
├── scroll.steps.js         # ALL scroll phrasings (page + scoped element).
├── element.steps.js        # Element interactions (focus / scroll-to / click-on-the-element / event dispatch / position).
├── input.steps.js          # Pointer input (hover / drag / dbl-click / right-click / viewport size / tap).
├── selectors.steps.js      # Named selector registry (CSS + XPath).
├── screenshot.steps.js     # Screenshot capture + auto-on-failure hook.
├── api.steps.js            # REST API steps (long form).
├── rest.steps.js           # REST API steps (short form).
├── xml.steps.js            # XML response assertions.
├── yaml.steps.js           # YAML response assertions.
├── network.steps.js        # Route stubs / blocks / delays / offline.
├── dialog.steps.js         # Native browser dialog handlers.
├── auth.steps.js           # storageState save / restore / clear.
├── clock.steps.js          # page.clock — install / advance / pause / set.
├── storage.steps.js        # Cookie + local storage + session storage.
├── a11y.steps.js           # POUR smoke checks (alt, label, landmarks, focus, lang).
├── javascript.steps.js     # JS error tracking + assertion.
├── web-first.steps.js      # Auto-retrying state matchers.
├── cookie.steps.js         # Cookie existence / value assertions.
├── keyboard.steps.js       # Single key + key combo presses.
├── link.steps.js           # Link href + title assertions.
├── path.steps.js           # JSON Pointer path / query parameter assertions.
├── response.steps.js       # Response header inspection.
├── responsive.steps.js     # Named breakpoint + explicit viewport sizing.
├── table.steps.js          # Data-table assertions.
├── metatag.steps.js        # <meta> tag assertions.
├── iframe.steps.js         # Frame switching + frame-scoped interactions.
├── file-download.steps.js  # Download capture + assertions.
└── debug.steps.js          # print URL / last response.
```

When you add a new step, place it in the file whose topic matches. Do NOT
spawn a new file unless the topic is genuinely orthogonal to every
existing file. New file → mention it in `docs/README.md` AND update the
table above.

## 4. Behavior-Based Robotics (BBR) wait policy

Static `sleep` is forbidden in step bodies. Every wait step uses
`smartSettle(page, budget)` from `webship.js`, which composites:

1. `<body>` attached
2. `DOMContentLoaded` fired
3. Playwright `networkidle`
4. `window.__webshipAjaxCount === 0` (custom fetch / XHR counter)
5. `window.__webshipPendingTimers === 0` (custom `setTimeout` counter)
6. `Date.now() - window.__webshipLastMutation >= 250 ms` (DOM-quiet)

The init script that installs counters 4 / 5 / 6 lives in `webship.js`'s
`openBrowser()` via `context.addInitScript()`. Never strip it.

Auto-settle hook: `AfterStep` runs `smartSettle(page, 1500)` after every
step whose text matches `STATE_MUTATING_STEP` (click / press / fill / …).
This is what makes `When I click "X" Then I should see "Y"` work without
an explicit wait. Disable per-run with `WEBSHIP_AUTO_SETTLE=off`.

## 5. Selector registry

* Selectors live in `tests/selectors/*.json`, two top-level keys: `css`,
  `xpath`.
* Built-in presets are normalised against `_canonical-keys.json`. New
  presets MUST use canonical key names where possible — `notice success`
  not `alert-success`, `main nav` not `admin menu`, `data table` not
  `entries table`.
* Named selector resolution priority: `css` registry first, then `xpath`
  (auto-prefixed with `xpath=`). Register in three ways: inline (`When I
  add "X" selector for "Y" css selector`), bulk via data table, or JSON
  files listed in `worldParameters.selectors.files`.
* Custom modal selector: every preset SHOULD expose a `modal` key. The
  modal helpers in `webship.js` use it before falling back to
  `[role="dialog"], dialog`.

## 6. Run modes

| Script | Effect |
| --- | --- |
| `npm test` | Default — pretty output, slow-mo 300 ms. |
| `npm run test:headed` | Headed browser, `SLOW_MO=800`. |
| `npm run test:fast` | `SLOW_MO=0`, single-process, full feature set. |
| `BROWSER={chromium\|firefox\|webkit} npm test` | Pick browser. |

For parallel + retry pass CLI flags directly:
`npx cucumber-js --parallel 4 --retry 1 --retry-tag-filter @flaky`.

Env vars: `LAUNCH_URL`, `BROWSER`, `HEADLESS`, `SLOW_MO`,
`WEBSHIP_AUTO_SETTLE`, `WEBSHIP_REPORT_DISABLE`, `WEBSHIP_REPORT_ARGS`,
`WEBSHIP_SCREENSHOT_*`.

## 7. Tests must stay green

Before declaring a task done:

1. Run `npx cucumber-js --dry-run` — no ambiguity, no undefined steps.
2. Run the full suite via `LAUNCH_URL=http://localhost:8080 npx cucumber-js`.
   All scenarios must pass.
3. If there are mismatches between examples and step patterns, fix them.
   Use the audit pattern: walk every JSDoc Example, strip the Gherkin
   keyword, and confirm the remainder matches the step regex.

## 8. AI agent wisdom — see [docs/12-ai-agent-guide.md](docs/12-ai-agent-guide.md)

That page distils the canonical guidance from *Webship-js-Recipes v1.0.30*
into one reference. Internalise these:

* **AI generates. Humans validate. Tests verify.** AI does not know what
  "correct" means for the business. The test suite is the executable
  contract.
* **Test-Drive-Develop loop.** Human writes feature file → human
  prompts AI → AI implements → tests verify. Pass = ship. Fail =
  iterate.
* **SPDD REASONS canvas.** Every prompt covers Requirements, Entities,
  Approach, Structure, Operations, Norms, Safeguards. Webship-js
  feature files map cleanly to it.
* **Cardinal SPDD rule.** When reality diverges from the prompt,
  **fix the prompt first**, then update the code.
* **Three Amigos before scenarios.** Product / QA / Dev questions get
  answered in `Feature:` description before any `Scenario:` lines.
* **DAMP / KISS / YAGNI / MMF.** Self-contained scenarios, simplest
  test that fails, no speculative features, smallest piece of value.
* **Golden rules** — see §AI Agent Guide for the full ten. Top three:
  test behaviour not implementation, wait for events not time, one
  behaviour per scenario.
* **AI pitfalls.** Over-trusting output, implementation tests, missing
  edge cases, false confidence. Mitigation: AI generates, humans
  validate against business requirements.

## 9. AI prompts — concrete templates

When asked to do common tasks, use these templates. They are battle-tested.

### Generate a feature file from a user story

```
Read templates/spdd-feature.md (REASONS canvas).
Fill every section before writing any Gherkin.
Place the filled-in canvas as # comments at the top of tests/features/<name>.feature.
Generate one Scenario per Operations item.
Tag each scenario with the relevant Norm / Safeguard category
  (@critical, @auth, @a11y, @security, @i18n).
Use built-in steps. Only write a custom step when no preset matches —
  and place it in the file whose topic matches (see CLAUDE.md §3).
Run npx cucumber-js tests/features/<name>.feature when done.
```

### Add a custom step

```
Search tests/step-definitions/*.steps.js for an existing matching step.
If one exists, point me at it instead of duplicating.
Pick the file whose topic matches.
Use a regex with (I |we )* — never plain 'I ...' Cucumber Expressions.
Plain English only — no camelCase identifiers in step text.
Add a JSDoc block with at least 5 Example #N: Gherkin lines.
Wrap risky locator actions with a friendly try/catch that explains
  the failure (see action.steps.js actOrExplain helper).
Run npx cucumber-js --dry-run to confirm no ambiguity.
Run the affected feature(s) to confirm green.
```

### Maintain tests after a UI change

```
Run the suite. Capture every failure: scenario name + step + expected/actual.
Group failures by root cause (usually 2-3 causes drive 90% of red).
For text-only changes, find/replace the step text in feature files.
For structural changes, update the named selector in tests/selectors/<preset>.json.
Re-run. Iterate until green. Commit prompt + code + selector changes together.
```

### Debug a flaky test

```
Re-run with HEADLESS=false SLOW_MO=800 to watch what really happens.
Look at screenshots/failed_*.png for the moment of failure.
Replace any wait Ns with an edge wait:
  wait until the URL contains "..."
  wait for "selector" to appear
  web-first matcher with within N seconds.
Verify each scenario creates its own data — no cross-scenario state.
If the bug is timing only in CI, bump the budget on the smart wait,
  do NOT add static sleeps.
```

### Run the project locally

```
npm install
npm start                # dev server on localhost:8080 (or set LAUNCH_URL)
npm test                 # full suite
npx cucumber-js --dry-run  # confirm no ambiguity, no undefined
```

### Rules of engagement (for the prompt itself)

When the user gives an ambiguous task, ASK before guessing. Specifically:

- "Where should this step live?" — pick the file whose topic matches §3.
- "Should this be a custom step or compose existing ones?" — prefer
  composing existing steps inside a feature scenario.
- "Should I commit?" — never. The user always commits manually.
- "Should I update docs?" — yes, in the same change. See §1.4.
- "Should I bump the version + zip?" — only when the user says "backup".

## 10. Avoid

* Comments that describe WHAT the code does — names already do that.
* Backwards-compatibility shims for unused code paths — delete unused code.
* Renaming `_unused` for variables — delete them.
* Adding feature flags for hypothetical future requirements.
* `// removed` comments — git history is the record, not the file.
* Replacing existing selectors with synonyms when canonical keys exist.
