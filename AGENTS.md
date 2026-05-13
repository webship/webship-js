# AGENTS.md — webship-js

This file follows the [agents.md](https://agents.md) convention: short,
machine-readable rules for any AI agent (Claude, Codex, Cursor, Copilot,
etc.) working on the repository.

For full project context, read `CLAUDE.md` in the same directory — it is
the canonical, longer policy. This file extracts the critical rules that
every agent must respect.

## Identity

webship-js is a BDD browser-automation harness built on Playwright +
Cucumber-js. It is its own product. Never reference Behat, DrevOps,
Drupal, or PHP in code, file names, comments, or step phrasings.

## Hard rules

1. **No git commits.** The user commits manually. Never invoke
   `git commit`, `git push`, `npm publish`, or anything that mutates a
   shared repository / registry without explicit per-action consent.
2. **Update docs in the same change.** Step / selector / config changes
   must update the matching page in `docs/`.
3. **Stay green.** Every change must keep `npx cucumber-js --dry-run`
   ambiguity-free and `npx cucumber-js` passing.
4. **Backups.** When asked, bump `package.json` `version` and emit
   `/var/www/html/products/webship-js-<version>.zip` excluding
   `node_modules/`, `tests/reports/`, `screenshots/`, `.git/`.

## Step definition rules

* Use a regex with `(I |we )*` — never `'I ...'` Cucumber Expressions
  unless the step genuinely cannot start with a pronoun.
* Write step text in plain English. Avoid camelCase identifiers
  (`local storage`, not `localStorage`).
* Every step needs a JSDoc block with at least 5 `Example #N:` Gherkin
  lines. Each example header line must match the step pattern when the
  Gherkin keyword is stripped.
* No static `sleep` calls. Wait steps go through `smartSettle()` in
  `webship.js`.
* Place new steps in the file whose topic matches. Don't create a new
  file unless the topic is genuinely orthogonal to every existing one.

## Do-not-merge boundaries

| Pair | Reason |
| --- | --- |
| `modal.steps.js` vs `dialog.steps.js` | HTML modal overlay vs native browser alert/confirm/prompt. |
| `field.steps.js` vs `form.steps.js` | CSS-selector field control vs label/placeholder/name form fills. |
| `xml.steps.js` vs `yaml.steps.js` | Different parsers and different path conventions. |
| `api.steps.js` vs `rest.steps.js` | Long-form (header + body table) vs short-form REST steps. |
| `web-first.steps.js` vs `assertion.steps.js` | Auto-retrying matchers vs single-snapshot assertions. |
| `element.steps.js` vs `input.steps.js` | Element-scoped (`the element "X"`) vs short pointer (`"X"`). |

## Quick prompt templates

**New feature file:** REASONS canvas → comments → Background → Scenarios →
tags → run.

**New step:** search first — if a match exists, point at it instead of
duplicating. Place by topic. Regex with `(I |we )*`. Plain English. JSDoc
with ≥5 examples. Friendly try/catch for locator actions.

**Maintenance:** run suite → group failures → fix selectors in JSON
preset (not feature files) → re-run → iterate.

**Flaky debug:** `HEADLESS=false SLOW_MO=800` → screenshots/ → replace
sleeps with edge waits.

## Workflow checklist

Before reporting a task complete:

* [ ] Ran the affected feature(s) via `LAUNCH_URL=http://localhost:8080 npx cucumber-js <path>`.
* [ ] Updated `docs/04-step-reference.md` and the topic doc if a step or
      selector preset changed.
* [ ] Updated `docs/README.md` source layout if a new step file was added.
* [ ] Verified examples match patterns (no audit mismatches).
* [ ] Bumped version + produced backup zip if user requested it.

## Wisdom from the Recipes book

`docs/12-ai-agent-guide.md` is the AI-specific guide distilled from
*Webship-js-Recipes v1.0.30*. Read it before authoring features or
step definitions. Critical takeaways:

* **AI generates. Humans validate. Tests verify.**
* **Test-Drive-Develop:** human writes Gherkin → AI implements → tests
  decide pass / fail.
* **SPDD REASONS canvas** (Requirements, Entities, Approach, Structure,
  Operations, Norms, Safeguards) — apply it before writing any
  `Scenario:` lines on high-value features.
* **Fix the prompt first** when reality diverges.
* **One scenario, one behaviour. Wait for events, not time. Test
  behaviour, not implementation.**

## Source map

Step definitions: `tests/step-definitions/`. The `webship.js` file there
is the single canonical entry point — World, hooks, init script, and
shared helpers (`smartSettle`, `getModalLocator`, `buildSelector`,
`gotoUrl`, `fillField`, `getLocatorText`, `pad`, `waitForPageLoad`,
`waitForModalState`, `findVisibleModal`, `isAnyModalVisible`,
`getModalSelector`).

Docs: `docs/` — see `docs/README.md` for the reading order.

Selector presets: `tests/selectors/*.json`. Canonical key list:
`tests/selectors/_canonical-keys.json`.
