# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

It is also the durable contract between human maintainers of webship-js and
any AI coding assistant working on the repository. Read it in full before
making changes. Follow it to the letter — these rules emerged from real
sessions and reflect strong preferences. `AGENTS.md` is the short,
machine-readable extract of the same rules; keep the two in sync.

## 0. Identity

webship-js is a BDD-first browser automation harness built on
**Playwright + Cucumber-js**. It is its own product. It is **NOT** Behat,
DrevOps, Drupal, or PHP. Code, file names, comments, and step phrasings
must never reference those tools or imply that webship-js was ported from
them. Treat webship-js as the source of truth.

Current line: **2.0.x** (branch `2.0.x`; `1.0.x` is the older main branch).
Node **≥ 20**.

## 1. Commands

```bash
npm install                       # required first — node_modules is not committed
npx playwright install --with-deps chromium   # browser binaries (CI does this too)
npm start                         # http-server over examples/ on :8080 (the fixture site)
npm test                          # full suite, pretty output, slowMo 300ms
```

`npm start` must be running (or `LAUNCH_URL` pointed elsewhere) before the
suite — nearly every bundled feature loads a static fixture from `examples/`.

| Command | Effect |
| --- | --- |
| `npm test` | Default — pretty output, slow-mo 300 ms, headless chromium. |
| `npm run test:headed` | `HEADLESS=false`, slow-mo auto-bumps to 800 ms. |
| `npm run test:fast` | `SLOW_MO=0`. |
| `npm run test:chromium` / `:firefox` / `:webkit` | Pick the browser (same as `BROWSER=…`). |
| `npx cucumber-js --dry-run` | Ambiguity / undefined-step check. Run this before declaring done. |
| `npm run generate-reports` | HTML (+ optional PDF) report from `tests/reports/cucumber_report.json`. |

Targeting a subset:

```bash
npx cucumber-js tests/features/modal.feature            # one feature file
npx cucumber-js tests/features/modal.feature:12         # one scenario, by line
npx cucumber-js --name "Dashboard renders"              # by scenario name
npx cucumber-js --tags "@critical and not @wip"         # by tag
npx cucumber-js --parallel 4 --retry 1 --retry-tag-filter @flaky
LAUNCH_URL=http://localhost:8080 npx cucumber-js        # point at another target
HEADLESS=false SLOW_MO=800 npx cucumber-js tests/features/x.feature   # watch a flake
```

Env vars: `LAUNCH_URL`, `BROWSER`, `HEADLESS`, `SLOW_MO`, `FORCE_COLOR`,
`WEBSHIP_AUTO_SETTLE`, `WEBSHIP_REPORT_DISABLE`, `WEBSHIP_REPORT_ARGS`,
`WEBSHIP_FILTER_HOOK_LINES`, `WEBSHIP_SCREENSHOT_*`, `WEBSHIP_VIDEO*`,
`WEBSHIP_JS_ERROR_*`, `WEBSHIP_SELECTORS_OFFSET`,
`WEBSHIP_SELECTORS_BREAKPOINTS`, `DIFFY_*`. Every one of them mirrors a
`worldParameters` key in `cucumber.js` — that file is the annotated
reference; read it before inventing a new knob.

## 2. Architecture

### 2.1 This repo is a library **and** its own test suite

`tests/` serves double duty: it is the step-definition library shipped to
consumers on npm *and* the self-test suite proving those steps work
against the static fixtures in `examples/`. A change to a step must keep
both roles green.

Consumer projects install the package and get scaffolded by
`bin/postinstall.js` → `bin/init-webship.js`, which writes a `cucumber.js`
whose `require` array points at
`node_modules/webship-js/tests/step-definitions/**/*.js` plus the
project's own `tests/step-definitions/`. Postinstall is a no-op when a
`cucumber.js` already exists, so re-installs never clobber user config.
**If you change the shape of `cucumber.js` `worldParameters`, update the
`CUCUMBER_JS` template inside `bin/init-webship.js` in the same change** —
otherwise new projects get scaffolded with a stale config.

### 2.2 `tests/step-definitions/webship.js` — the single canonical entry point

Everything shared lives here; every `*.steps.js` does
`require('./webship')`. It owns, in one file:

* **The World** (`PlaywrightWorld extends World`) — `page`, `context`,
  `playwrightBrowser`, `frame` (iframe scope), `launchUrl`, `minWaitTime`,
  `assetsFolder`, and the named-selector registries `__selectorsCss` /
  `__selectorsXpath`. `setDefaultTimeout(45s)` — deliberately above
  Playwright's 30 s default so locator timeouts reach our try/catch
  wrappers and testers see a friendly message, not "function timed out".
  The 45 s in `cucumber.js` exists for the same reason; keep them aligned.
* **The init script** installed via `context.addInitScript()` in
  `openBrowser()` — monkey-patches `fetch`, `XMLHttpRequest.send`,
  `setTimeout`/`clearTimeout` and attaches a `MutationObserver` to
  maintain `window.__webshipAjaxCount`, `__webshipPendingTimers`,
  `__webshipLastMutation`. This is the substrate the whole wait policy
  stands on. **Never strip it.**
* **Hooks** — `Before({order:5})` opens the browser (merging
  `recordVideo` context options when video is on); `After({order:5})`
  captures the video path *before* closing the context, saves/deletes per
  mode, then closes the browser; `BeforeStep` resolves `[relative:…]` date
  tokens in step text, doc strings, and data-table cells; `AfterStep`
  runs the auto-settle.
* **Shared helpers** (exported): `smartSettle`, `waitForPageLoad`,
  `buildSelector`, `gotoUrl`, `fillField`, `getLocatorText`, `pad`,
  the modal probes (`getModalSelector`, `getModalLocator`,
  `waitForModalState`, `findVisibleModal`, `isAnyModalVisible`), the date
  helpers (`resolveRelativeDate`, `parseRelativeOffset`,
  `formatRelativeDate`), and the error builders (`friendly`, `humanize`).
* **Two process-level side effects**: a stdout/stderr filter that strips
  noisy `✔ Before # …` hook lines from cucumber's failure dump
  (`WEBSHIP_FILTER_HOOK_LINES=off` to disable), and a `process.on('exit')`
  hook that auto-generates the HTML report via `bin/generate-reports`
  (`WEBSHIP_REPORT_DISABLE=1` to disable, `WEBSHIP_REPORT_ARGS` to pass
  flags).

### 2.3 Config layering

`playwright.config.ts` (browser choice, launch args, context options) is
loaded by `webship.js` from `process.cwd()` — so a consumer project's own
copy wins. `cucumber.js` supplies `worldParameters` (launch URL, wait
padding, selector registry + files + breakpoints, screenshot, video,
and javascript-error settings). Resolution order everywhere is
**env var → `worldParameters` → built-in default**; follow that order in
any new option.

### 2.4 Error contract — tester-facing, not developer-facing

Risky locator work is wrapped and re-thrown through `friendly()`, which
renders `Could not <action> "<target>". / Why: <humanize(cause)> /
Hint: …` and sets `err.stack` to that body so cucumber prints no JS stack.
`humanize()` maps ~20 Playwright/Node/HTTP patterns to plain English.
`action.steps.js`'s `actOrExplain(label, target, fn)` is the reference
wrapper — copy that shape for new interaction steps. Never let a raw
Playwright error reach the tester.

### 2.5 Named selector registry

`selectors.steps.js` owns the registry. Selectors resolve **css first,
then xpath** (auto-prefixed `xpath=`). Three registration paths: inline
step, bulk data table, or JSON files listed in
`worldParameters.selectors.files` (loaded from `filesPath`). 26 presets
ship in `tests/selectors/` (14 CMS admin skins, 9 CSS frameworks, generic
front/back-end/homepage), normalised against `_canonical-keys.json`. Registry keys
are also what the human-language steps read — `Then I see main nav above
breadcrumb`, `When I click primary button` — which is why canonical key
names matter more than they look.

### 2.6 Visual regression lives outside this repo

The Diffy step-pack was extracted to its own plugin,
[`diffy-steps`](https://github.com/webship/diffy-steps). webship-js no
longer ships `tests/step-definitions-diffy/`, the `diffy`
`worldParameters` block, or the mock Diffy API. Consumers install the
plugin and add `node_modules/@webship/diffy-steps/tests/step-definitions/**/*.js`
to their own `require:` list. Nothing in this repo depends on it — the
steps only ever used `@cucumber/cucumber`, `axios`, and Node built-ins.
Treat any `diffy` question as a `diffy-steps` question.

### 2.7 CI

Fifteen provider configs at the repo root (`.github/workflows/`,
`.gitlab-ci.yml`, `.circleci/`, `azure-pipelines.yml`,
`bitbucket-pipelines.yml`, `buildspec.yml`, `cloudbuild.yaml`,
`codefresh.yml`, `.drone.yml`, `Jenkinsfile`, `.semaphore/`, `.teamcity/`,
`bamboo-specs/`, `.harness/`, `.travis.yml`). They all run the same shape: install →
`npx playwright install` → `npm start &` → `npm test`. Change one, change
them all, and update `docs/16-ci-cd.md`.

## 3. Communication & change rules

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
   * New step file → add it to the source layout block in `docs/README.md`
     (which carries per-file step counts — keep them accurate).
   * Topic-level addition (auth, network, clock, …) → add or refresh the
     dedicated page (`docs/07-auth-state.md`, `docs/06-network-and-dialogs.md`,
     etc.).
   * Selector preset added under `tests/selectors/` → add to the table in
     `docs/03-selector-registry.md`.
   * New config key → `cucumber.js` comment, `bin/init-webship.js`
     template, and `docs/global-settings.md`.
5. **Backups.** When the user says "backup" or asks for a versioned zip,
   bump the patch version in `package.json` and produce
   `~/workspace/products/webship-js-<version>.zip`. Excludes:
   `node_modules/`, `tests/reports/`, `screenshots/`, `.git/`.

## 4. Step definition rules

### 4.1 Phrasing

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

### 4.2 JSDoc block — required for every step

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

Audit the examples by walking every JSDoc `Example #N:` line, stripping the
Gherkin keyword, and confirming the remainder matches the step regex. Keep
mismatches at zero. (Past sessions used a throwaway `audit-examples.js`
for this; write it into the scratchpad, not the repo.)

### 4.3 No duplicate logic

Before adding a step, search existing files. Identical Playwright calls
under different phrasings ARE allowed when the phrasings target different
audiences (e.g. `I hover over "X"` versus `I hover over the element "X"`).
True duplicate logic — same code, same conceptual scope — must be merged
or deleted.

### 4.4 Do NOT merge

Some pairs look similar but cover different domains. NEVER merge:

| Pair | Domain boundary |
| --- | --- |
| `modal.steps.js` vs `dialog.steps.js` | HTML modal overlay (`role="dialog"`, `.modal`) vs native browser alert / confirm / prompt. |
| `field.steps.js` vs `form.steps.js` | CSS-selector field control vs label / placeholder / name form fills. |
| `assertion.steps.js` vs `web-first.steps.js` | Single-snapshot page assertions vs auto-retrying matchers (`within N seconds`). |
| `xml.steps.js` vs `yaml.steps.js` | Different parsers, different path conventions. |
| `api.steps.js` vs `rest.steps.js` | Long form (header + body table) vs short-form REST. |
| `element.steps.js` vs `input.steps.js` | Element-scoped (`the element "X"`) vs short pointer (`"X"`). |

## 5. File organisation

413 built-in steps across 36 step files. Cucumber auto-loads every
`*.steps.js` in `tests/step-definitions/`.

```
tests/step-definitions/
├── webship.js              # World, hooks, init script, shared helpers — see §2.2. Not a steps file.
├── a11y.steps.js           (26)  # axe-core WCAG audits + POUR hygiene probes (axe loaded lazily)
├── action.steps.js          (7)  # press / click / follow / attach file (actOrExplain lives here)
├── api.steps.js            (22)  # REST long form — base URL, headers, query, body, JSON Pointer
├── assertion.steps.js      (14)  # see / not see, in row, in element, response, count
├── auth.steps.js            (3)  # storageState save / restore / clear
├── clock.steps.js           (7)  # page.clock — install / advance / pause / set
├── cookie.steps.js         (12)  # cookie exists / equals / contains
├── debug.steps.js           (2)  # print URL / last response
├── dialog.steps.js          (8)  # native alert / confirm / prompt handlers
├── element.steps.js        (19)  # focus / scroll-to / dispatch / count / position
├── field.steps.js          (27)  # field, checkbox, radio, select-list state assertions
├── file-download.steps.js   (8)  # download capture + filename / mime / path assertions
├── form.steps.js           (13)  # fill / select / additionally select / check / uncheck / radio
├── iframe.steps.js         (10)  # frameLocator switch + frame-scoped interactions
├── input.steps.js           (9)  # hover / drag / dbl-click / right-click / tap / viewport size
├── javascript.steps.js      (4)  # JS error tracking + assertion (warn / fail / off)
├── keyboard.steps.js        (4)  # single key + combos with alias normalisation
├── link.steps.js            (9)  # href / title / target / rel assertions
├── metatag.steps.js         (3)  # <meta> description / keywords / OG / Twitter
├── modal.steps.js           (9)  # HTML modal visibility / content / interactions
├── navigation.steps.js     (11)  # anonymous user, homepage, paths, history, URL assertions
├── network.steps.js        (10)  # route stubs / blocks / delays / offline
├── path.steps.js            (8)  # URL path / query parameter / fragment
├── response.steps.js        (4)  # response header inspection
├── responsive.steps.js      (5)  # named breakpoints + explicit viewport
├── rest.steps.js            (5)  # REST short form
├── screenshot.steps.js      (6)  # manual + auto-on-failure + per-step capture
├── scroll.steps.js         (12)  # ALL scroll phrasings (page + scoped element)
├── selectors.steps.js      (24)  # named CSS / XPath registry + position + human-language steps
├── storage.steps.js         (9)  # local storage + session storage
├── table.steps.js           (8)  # data-table row / column assertions
├── video.steps.js           (4)  # start / stop / save webm recording
├── wait.steps.js           (21)  # ALL wait phrasings (BBR — see §6)
├── web-first.steps.js      (12)  # auto-retrying state matchers
├── xml.steps.js            (20)  # XPath equals / contains / count / attr
└── yaml.steps.js           (38)  # multi-doc, types, numerics, JSON Schema, diff

tests/features/                 # 71 .feature files
tests/selectors/                # 26 JSON presets + _canonical-keys.json
tests/assets/                   # upload fixtures (pdf, png)
examples/                       # static HTML fixtures served by `npm start`
bin/                            # init-webship / postinstall / generate-reports
docs/                           # 17 numbered guides + mirrored reference pages
```

When you add a new step, place it in the file whose topic matches. Do NOT
spawn a new file unless the topic is genuinely orthogonal to every
existing file. New file → mention it in `docs/README.md` AND update the
table above.

## 6. Behavior-Based Robotics (BBR) wait policy

Static `sleep` is forbidden in step bodies. Every wait step uses
`smartSettle(page, budget)` from `webship.js`, which composites:

1. `<body>` attached
2. `DOMContentLoaded` fired
3. Playwright `networkidle`
4. `window.__webshipAjaxCount === 0` (custom fetch / XHR counter)
5. `window.__webshipPendingTimers === 0` (custom `setTimeout` counter)
6. `Date.now() - window.__webshipLastMutation >= 250 ms` (DOM-quiet)

Conditions 4/5/6 are evaluated atomically in one `waitForFunction`, so a
late-firing `setTimeout` that mutates the DOM re-arms the wait.

Auto-settle hook: `AfterStep` runs `smartSettle(page, 1500)` after every
step whose text matches `STATE_MUTATING_STEP` (click / press / fill /
select / check / attach / reload / navigate / …). This is what makes
`When I click "X" Then I should see "Y"` work without an explicit wait.
Disable per-run with `WEBSHIP_AUTO_SETTLE=off`. If a wait is flaky only in
CI, raise the budget — never add a static sleep.

## 7. Selector registry

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
* When a UI change breaks tests, fix the selector in the JSON preset —
  not the feature files.

## 8. Tests must stay green

Before declaring a task done:

1. `npm install` if `node_modules/` is absent (it is not committed).
2. Run `npx cucumber-js --dry-run` — no ambiguity, no undefined steps.
3. Run the full suite with the fixture server up:
   `npm start &` then `LAUNCH_URL=http://localhost:8080 npx cucumber-js`.
   All scenarios must pass.
4. Fix any mismatch between JSDoc examples and step patterns (§4.2).
5. Report honestly: if you could not run the suite, say so rather than
   implying green.

## 9. AI agent wisdom — see [docs/12-ai-agent-guide.md](docs/12-ai-agent-guide.md)

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
* **Golden rules** — top three: test behaviour not implementation, wait
  for events not time, one behaviour per scenario.
* **AI pitfalls.** Over-trusting output, implementation tests, missing
  edge cases, false confidence. Mitigation: AI generates, humans
  validate against business requirements.

Tag conventions live in `docs/15-tag-conventions.md` — `@critical`,
`@smoke`, `@auth`, `@security`, `@a11y`, `@i18n`, `@perf`, `@flaky`,
`@wip`, `@desktop`/`@mobile`, `@external`, `@auth-setup`, plus the
recording tags `@video` / `@no-video` and the JS-error tags `@js-fail` /
`@js-warn` / `@js-off`.

## 10. AI prompts — concrete templates

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
  and place it in the file whose topic matches (see CLAUDE.md §5).
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
Record it: WEBSHIP_VIDEO=on npx cucumber-js <path>  (or tag the scenario @video).
Replace any wait Ns with an edge wait:
  wait until the URL contains "..."
  wait for "selector" to appear
  web-first matcher with within N seconds.
Verify each scenario creates its own data — no cross-scenario state.
If the bug is timing only in CI, bump the budget on the smart wait,
  do NOT add static sleeps.
```

### Rules of engagement (for the prompt itself)

When the user gives an ambiguous task, ASK before guessing. Specifically:

- "Where should this step live?" — pick the file whose topic matches §5.
- "Should this be a custom step or compose existing ones?" — prefer
  composing existing steps inside a feature scenario.
- "Should I commit?" — never. The user always commits manually.
- "Should I update docs?" — yes, in the same change. See §3.4.
- "Should I bump the version + zip?" — only when the user says "backup".

## 11. Local AI agents & skills that drive webship-js

Seven local Claude Code definitions target webship-js. They are **not**
part of this repo (`.gitignore` excludes `.claude`) — they are authored in
the workspace repos and installed into `~/.claude/`:

| Source of truth | Installed to | Sync |
| --- | --- | --- |
| `~/workspace/agents/*.md` | `~/.claude/agents/` | `agents/cmd-tool-sync-agents.sh --install` (also mirrors the shared `webship/ai-agents` repo) |
| `~/workspace/skills/<name>/SKILL.md` | `~/.claude/skills/` | `skills/cmd-tool-sync-skills.sh` |

### Agents

| Agent | Model | Scope |
| --- | --- | --- |
| `agent-webship-js` | opus | The full specialist. Scaffold (Node.js or DDEV) → author `.feature` files → write custom steps → run → debug → HTML/PDF report. Carries a distilled copy of the whole step catalog, the BBR/selector/tag sections, the 20-recipe cookbook, Varbase learnings, and recipes AI-1…AI-5. Use for anything non-trivial. |
| `webship-ai-agent` | sonnet | The loop-until-green worker for a consumer project: read available steps → write/fix scenarios → run → fix root cause → iterate to zero failures. Lighter, autonomous, Drupal/DDEV-flavoured (`NN-NN-NN-name.feature`, `https://<project>.ddev.site`). |

### Skills (slash commands)

| Skill | Does |
| --- | --- |
| `/webship-js-init` | Scaffold a test project for a URL, or `--ddev` for the `ddev-webship-js` add-on. Idempotent; never clobbers `cucumber.js` without `--force`. |
| `/webship-js-create` | Author `tests/features/<page>--<category>.feature` for a page or flow — desktop + mobile, web-first assertions, named selectors, tags. |
| `/webship-js-run` | Run the suite (tag expression or feature path), generate HTML/PDF, and return a root-cause summary per failure. |
| `/webship-js-audit` | Lint features + custom steps against the documented anti-patterns — sleep-driven waits, god scenarios, brittle selectors, implementation testing, premature custom steps, leaked module state. Output is `file:line — severity — pattern — fix`. |
| `/webship-js-steps` | Step catalog reference, filterable by category. |

`barmoog-webship-js-{init,create,run,audit,steps}` are the same five skills
hard-targeted at a Barmoog Odoo 18.0 instance. Don't edit them for
webship-js changes — fix the `webship-js-*` originals and let the Barmoog
copies be re-derived.

### What this means when working *inside* this repo

1. **Every one of them reads `node_modules/webship-js/…` as the source of
   truth.** That path does not exist here — this *is* the package. Translate:
   `node_modules/webship-js/tests/step-definitions/` → `tests/step-definitions/`,
   `node_modules/webship-js/docs/` → `docs/`,
   `node_modules/webship-js/bin/` → `bin/`.
   Running one of these skills unmodified in this repo will find nothing and
   fall back to fetching from GitHub — i.e. it will read the *published*
   step regex, not your uncommitted change. Read the local files directly
   instead.
2. **Step regex, JSDoc examples, and `docs/` are their API.** The agents are
   explicitly instructed to verify phrasing against the installed
   `<category>.steps.js` and its JSDoc before recommending a step. A
   rename here silently changes what every agent tells every user — which
   is the real reason for the docs rule in §3.4 and the ≥5-examples rule
   in §4.2.
3. **Known drift to be aware of, not to "fix" here:** the agents and the
   `/webship-js-run` skill reference a `worldParameters.users` registry and
   an auth helper built on it. There is no `users` key in this repo's
   `cucumber.js` or in `bin/init-webship.js` — it is a Varbase-project
   convention layered on top. If a user asks about `users`, say so rather
   than adding the key on the agents' say-so.
4. **Guardrails they already carry** (so don't re-litigate them): never
   commit; never overwrite a user's `.feature` or `cucumber.js` without
   explicit consent; verify a step exists before recommending it; when
   reality diverges from the prompt, fix the prompt first.

## 12. Avoid

* Comments that describe WHAT the code does — names already do that.
* Backwards-compatibility shims for unused code paths — delete unused code.
* Renaming `_unused` for variables — delete them.
* Adding feature flags for hypothetical future requirements.
* `// removed` comments — git history is the record, not the file.
* Replacing existing selectors with synonyms when canonical keys exist.
* Raw Playwright errors surfacing to testers — always go through
  `friendly()` / `humanize()`.
