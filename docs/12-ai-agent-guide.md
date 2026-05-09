# AI Agent Guide — Wisdom from the Recipes Book

This page distills the canonical guidance from
**Webship-js-Recipes v1.0.30** (583 pages, 35 chapters, 340+ recipes) into
a compact reference for AI coding assistants working on any webship-js
project.

The wisdom here is the product of years of BDD practice — Kent Beck's
TDD revolution, Dan North's BDD reframing, Martin Fowler / Thoughtworks
SPDD, and the daily reality of automated browser testing. Read it once.
Apply it on every change.

---

## The First Principle

> **AI generates. Humans validate. Tests verify.**

AI does not know what "correct" means for the business. It can write
code that compiles, runs, and looks reasonable — but only the test
suite can prove the code does what the business actually needs. That is
why webship-js scenarios exist: they are the executable contract.

Three corollaries:

1. **The person who writes the tests controls the quality.**
2. **The person who controls the quality controls the product.**
3. **Code is the artifact. The prompt and the tests are the source of truth.**

---

## Test-Drive-Develop (TDD's evolution for the AI age)

Traditional TDD: write a test, make it pass, refactor.

Test-Drive-Develop (TDD AI): a closed loop where humans specify, AI
implements, tests verify.

```
TEST   →  human writes the feature file (Gherkin = the contract).
DRIVE  →  human prompts AI: "implement what passes these scenarios".
DEVELOP → AI writes code. Tests pass → ship. Tests fail → iterate.
```

The webship-js suite is the verification step. If green, AI produced
code matching the structured prompt. If red, AI iterates against the
failing scenario name + step + expected/actual — no human bottleneck.

---

## SPDD — Structured Prompt-Driven Development

Coined by Thoughtworks. Treats prompts as first-class delivery
artifacts: version-controlled, reviewed, reused.

### The REASONS canvas

Every prompt should pass through these seven sections:

| Letter | Section | Purpose |
| --- | --- | --- |
| **R** | Requirements | Problem statement + definition of done |
| **E** | Entities | Domain nouns + relationships |
| **A** | Approach | Strategy to meet the requirements |
| **S** | Structure | Components, pages, routes, dependencies |
| **O** | Operations | Concrete testable steps with signatures |
| **N** | Norms | Cross-cutting engineering standards (i18n, a11y, perf, logging) |
| **S** | Safeguards | Non-negotiable boundaries (security, privacy, rate limits, failure modes) |

Webship-js feature files are SPDD prompts in disguise. Map:

| REASONS | Webship-js artifact |
| --- | --- |
| Requirements | `Feature:` + `As / I want / So that` |
| Entities | Domain nouns in step text |
| Approach | `Background` + scenario outlines |
| Structure | `tests/` layout + `cucumber.js` |
| Operations | Individual `Given / When / Then` steps |
| Norms | `worldParameters` + locale / a11y scenarios |
| Safeguards | Tags (`@critical`, `@security`), assertion scenarios |

### The cardinal SPDD rule

> **When reality diverges from the prompt, fix the prompt first. Then
> update the code.**

A code-first fix forgets to update the spec. Six months later, a
refactor removes the fix, the spec says nothing about it, and the bug
returns. Prompt-first fixes prevent decay.

### The three SPDD skills

1. **Alignment** — lock intent before writing code. Show the `Feature:` narrative to product / design / security. Get nods. Then write scenarios.
2. **Abstraction-First** — design before generating. Define Background + named selectors before per-scenario steps.
3. **Iterative Review** — never let AI run unattended for more than one feature at a time. Review after every generation.

---

## What BDD Actually Tests

| Question | TDD answer | BDD answer |
| --- | --- | --- |
| Tests what? | Components (classes / functions) | Features (user actions / business behaviour) |
| Written by? | Developers | Team (Three Amigos) |
| Language? | Programming language | Gherkin (plain text) |
| Audience? | Developers | Everyone |
| Granularity? | Function / class | User story / feature |
| On failure? | Knows which component | Knows which feature |
| Documentation? | Code comments | Living specification |

Use **both**. BDD at the feature level, TDD at the component level.
They complement each other.

---

## The Three Amigos

A 15–30 minute conversation format BEFORE coding starts:

```
Product Owner  ─►  describes intent
QA / Tester    ─►  writes scenarios
Developer      ─►  implements steps
                          │
                          ▼
                Executable specification
                      (.feature files)
```

When you (an AI agent) are asked to add a new feature, simulate the
Three Amigos: list the Product / QA / Dev questions a human team would
ask. Answer them in the feature description before writing any
scenarios.

---

## DAMP, KISS, YAGNI

* **DAMP** — Descriptive And Meaningful Phrases. Every scenario must be
  understandable without context. No abbreviations. No undefined nouns.
* **KISS** — Keep It Simple, Stupid. Write the simplest test that could
  fail. Write the simplest code that makes it pass.
* **YAGNI** — You Ain't Gonna Need It. Do NOT write tests for features
  nobody asked for. Every scenario must trace to a real business need.

The MMF principle (Minimum Marketable Feature): ship the smallest
piece of behaviour that delivers value. Add the next one only when the
first one is verified green.

---

## The Anti-Patterns Hall of Fame

| Anti-pattern | Symptom | Fix |
| --- | --- | --- |
| **Sleep-driven testing** | `wait 3s` after every action | BBR smart waits — wait for the EVENT, not the clock |
| **God step** | `Given the system is fully set up with admin user and products and orders` | Decompose into specific composable steps |
| **Coupled scenarios** | Scenario 2 assumes scenario 1's data exists | Each scenario creates its own test data |
| **Implementation testing** | `Then the database should have a record in users table` | Test what the user experiences, not how the code works |
| **Brittle selectors** | Tests break when CSS changes | Named selectors + accessible role locators |
| **Over-trusting AI output** | AI generates 500 tests, none cover the business edge case | AI generates, human validates against requirements |
| **God scenario** | One scenario tests login + search + checkout | One behaviour per scenario |
| **Sleep-then-check** | `wait 5s` then assertion | Web-first matcher with `within N seconds` |

---

## The Golden Rules of webship-js Testing

These ten rules emerged from years of BDD practice. Internalise them.

1. Write tests BEFORE code (or at least before you ship).
2. One scenario = one behaviour.
3. Each scenario creates its own test data.
4. **Wait for events, not time.** (BBR — see `docs/02-bbr-smart-waits.md`)
5. Test behaviour, not implementation.
6. Use business language, not developer jargon.
7. Decouple from CSS / HTML structure (named selectors + roles).
8. Make tests deterministic. No flaky `@flaky` allowed long-term.
9. Tag scenarios. `@critical` for the smoke set; `@security` / `@a11y` for boundary scenarios.
10. **Fix the prompt before the code** when reality diverges.

---

## Recipes for AI Agents

### Recipe AI-1: Generate a feature file from a user story

When asked to author a webship-js `.feature` file:

1. Read `templates/spdd-feature.md` if it exists, or use the REASONS
   canvas from this guide.
2. Fill **every** section before writing any Gherkin.
3. Place the filled-in REASONS canvas as `#` comments at the top of the
   `.feature` file.
4. Generate one scenario per Operations item.
5. Tag every scenario with the relevant Norm / Safeguard category
   (`@critical`, `@auth`, `@a11y`, `@security`, `@i18n`).
6. Use `Background:` for setup steps shared across scenarios.

### Recipe AI-2: Generate a step definition

When asked to add a custom step:

1. Search `tests/step-definitions/*.steps.js` for an existing matching
   step. If one exists, do NOT add a duplicate — point the user at it.
2. Pick the file whose topic matches (see `CLAUDE.md` §3 source map).
3. Use a regex with `(I |we )*` — never `'I ...'` Cucumber Expressions
   unless the step genuinely cannot start with a pronoun.
4. Add a JSDoc block with at least 5 `Example #N:` Gherkin lines that
   match the step pattern.
5. Use plain English in the step text. No camelCase identifiers.
6. Run the audit: every example must match its step pattern.

### Recipe AI-3: Maintain tests after a UI change

The UI changed. 30 tests are red.

1. Run the suite. Capture every failure: scenario name + failing step +
   expected / actual.
2. Group failures by root cause. Usually 2–3 causes drive 90% of the red.
3. Find-and-replace step text where the change is purely cosmetic
   ("Sign in" → "Log in").
4. For structural changes, update the named selector preset, NOT every
   feature file.
5. Re-run the suite. Iterate until green.
6. Commit prompt + code + selector changes together.

### Recipe AI-4: Debug a flaky test

A test passes locally but fails in CI.

1. Check the failing step. Does it run an action? Is the next step a
   read assertion? If yes, suspect timing.
2. Replace `wait Ns` with an edge-driven wait — `wait until the URL
   contains "..."`, `wait for ".success" to appear`, web-first matchers
   with `within N seconds`.
3. Verify no shared state — does the test depend on a previous
   scenario's side-effects? Make it self-contained.
4. Run with `HEADLESS=false SLOW_MO=800` to watch what really happens.
5. Inspect screenshots in `screenshots/failed_*.png`.

### Recipe AI-5: When tests go bad

| Symptom | Probable cause | Fix |
| --- | --- | --- |
| Passes sometimes, fails other times | Timing | Smart waits / BBR |
| Breaking when unrelated code changes | Coupling to CSS structure | Named selectors / roles |
| Taking too long | Too many browser tests for API-testable logic | Move to API level |
| Hard to understand | Imperative style | Declarative language |
| Depending on other tests | Shared state | Each scenario creates own data |
| Testing CSS classes / DOM | Implementation testing | Test visible behaviour |
| Hardcoded waits everywhere | Sleep-driven testing | `wait for AJAX to finish`, web-first |
| Giant `Background:` section | Setup overload | Move setup to dedicated steps |
| Asserting too many things per scenario | Multi-behaviour scenario | One behaviour per scenario |
| Checking database state directly | Implementation coupling | Check UI / API instead |

---

## What changes in the AI age

| Activity | Before AI | With AI |
| --- | --- | --- |
| Code generation | Skill | Commodity |
| Test writing | Skill | Amplified — humans guide, AI assists |
| Business understanding | Premium | Premium-er |
| Quality assurance | Critical | Critical (AI output needs validation) |

The economic shift: code is cheaper to produce, but specification and
verification are MORE valuable. Webship-js positions you on the
valuable side — Gherkin is the spec, step definitions are the
verification.

---

## Pitfalls of AI-Generated Tests

1. **Over-trusting output.** AI can generate tests that look correct
   but assert the wrong thing. Always review against business
   requirements.
2. **Testing implementation, not behaviour.** AI tends to test what the
   code does. Human oversight keeps tests behaviour-focused.
3. **Missing edge cases.** AI generates the happy path well. Business
   edge cases need a domain expert.
4. **False confidence.** "We have 500 AI-generated tests!" means
   nothing if they don't cover what matters.

> **The rule:** AI generates. Humans validate.

---

## When to use SPDD vs vibe-code

**Use SPDD (REASONS canvas + structured prompts):**

* Regulated systems (finance, healthcare, government).
* Enterprise CMS where business logic accumulates over years.
* Customer-facing flows with security or accessibility requirements.
* Any feature whose behaviour must remain stable across releases.

**Skip SPDD (vibe coding is fine):**

* Throwaway prototypes.
* One-off internal scripts.
* UI explorations where you have not decided what the feature does.

The cost of SPDD is the time to fill the canvas. The benefit is years
of preserved intent. Pick the projects where the benefit clears the cost.

---

## The Future-Proof Mindset

Before SPDD: **code is primary, specs are documentation.**
After SPDD: **prompts are primary, code is the artifact the prompt produces.**

This is not academic. It changes how you debug. It changes how you
onboard. It changes how AI-driven refactors stay safe over years.

Webship-js was built for this world. Every step definition is a verb.
Every feature file is a contract. Stack SPDD on top, and you have a
system where:

* Prompts are committed.
* Tests are executable.
* AI generates code.
* Tests verify.
* Failures point at the prompt, not at the engineer's coffee intake.

Master the loop.

---

## Source

This page summarises *Webship-js-Recipes v1.0.30* — chapters 1, 7, 21,
24, 26, 29, 30, 31, 33, 34, 35 plus appendices. The full PDF lives at
`/home/rajab/Desktop/w-book/Webship-js-Recipes-v1.0.30.pdf`. The
chapter Markdown sources live at `/home/rajab/Desktop/w-book/chapters/`.
