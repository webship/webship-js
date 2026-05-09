# Accessibility (a11y)

Webship-js ships **two layers** of accessibility coverage:

1. **Custom JS probes** — fast, dependency-free assertions for POUR
   fundamentals (Perceivable, Operable, Understandable, Robust). Each
   probe maps to a specific WCAG 2.1 / 2.2 success criterion.
2. **axe-core full audit** — official Deque engine (`@axe-core/playwright`
   + `axe-core`). Runs ~100 rules covering WCAG 2.0 / 2.1 / 2.2 levels
   A, AA, AAA plus best-practice and experimental rules. Each violation
   carries an `impact` (`minor` / `moderate` / `serious` / `critical`)
   for triage.

## Standards & references

* [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — current baseline most laws cite.
* [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — September 2023 update.
* [W3C WAI](https://www.w3.org/WAI/) — Web Accessibility Initiative overview.
* [W3C Evaluation Tools List](https://www.w3.org/WAI/test-evaluate/tools/list/)
* [MDN — Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
* [axe-core rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
* [Deque Labs](https://github.com/dequelabs/) — axe-core, axe-linter, IDE plugins.

## Page structure

```gherkin
Then the page should declare a language
 And the page language should be "en"
 And the page should have a main landmark
 And the page should have a navigation landmark
 And the page should have exactly one h1
```

## Images & form labels

```gherkin
Then every image should have an alt attribute
 And every form field should have an accessible label
```

`every image` allows empty `alt=""` (decorative) and `role="presentation"`. Missing alt fails.

`every form field` counts as labelled when **any** of the following is true:
- An `aria-label` attribute is present
- An `aria-labelledby` attribute resolves to an element
- A `<label for="...">` matches the field's id
- The field is wrapped by a `<label>`

Submit/reset/button/image inputs and `type="hidden"` are exempt.

## Focus assertions

```gherkin
When I focus on the element "#email"
Then the focused element should match "#email"
 And the focused element should be labeled "Email"
```

The labeled assertion resolves the accessible name in priority order:
1. `aria-label`
2. `aria-labelledby` referenced element
3. `<label for="...">` text
4. Wrapping `<label>` text
5. `value` / `placeholder` / `title` / `textContent`

## Keyboard navigation

The `keyboard.steps.js` file exposes:

```gherkin
When I press the "Tab" key
When I press the "Tab" key 3 times
When I press the "Enter" key
When I press the "Escape" key
When I press the "ArrowDown" key
```

Combine with focus assertions:

```gherkin
Scenario: Tab order is correct
  Given I am on "/login"
   And I focus on the element "body"
  When I press the "Tab" key
  Then the focused element should match "#email"
  When I press the "Tab" key
  Then the focused element should match "#password"
  When I press the "Tab" key
  Then the focused element should match "button[type=submit]"
```

## WCAG hygiene probes

Lightweight checks that map to specific WCAG criteria. No axe-core required.

```gherkin
Then the page should have a title
 And user zoom should be allowed
 And the heading hierarchy should be valid
 And the page should have a skip link
 And every button should have an accessible name
 And every link should have an accessible name
 And no element should have a positive tabindex
 And every ARIA reference should resolve
 And every ARIA role should be valid
 And required fields should be consistently marked
```

| Step | WCAG SC |
| --- | --- |
| `the heading hierarchy should be valid` | 1.3.1, 2.4.6 |
| `the page should have a skip link` | 2.4.1 |
| `every button should have an accessible name` | 4.1.2 |
| `every link should have an accessible name` | 2.4.4, 4.1.2 |
| `no element should have a positive tabindex` | 2.4.3 |
| `every ARIA reference should resolve` | 4.1.2 |
| `every ARIA role should be valid` | 4.1.2 |
| `the page should have a title` | 2.4.2 |
| `user zoom should be allowed` | 1.4.4, 1.4.10 |
| `required fields should be consistently marked` | 3.3.2 |

## axe-core full audit

```gherkin
Then the page should pass an accessibility audit
 And the page should pass an accessibility audit at level "AA"
 And the page should pass an accessibility audit at level "AAA"
 And the page should have no critical accessibility violations
 And the page should have no serious accessibility violations
 And the element "main" should pass an accessibility audit
 And the page should pass an accessibility audit excluding "iframe.payment"
 And the page should not violate the accessibility rule "color-contrast"
 And the page should pass the accessibility rules "image-alt, label, button-name"
 Then I print accessibility violations
```

Default audit level is **AA** — required by EU Web Accessibility
Directive, US Section 508, UK PSBAR. Use `at level "AAA"` for stricter
gates.

Common axe rule ids worth pinning: `color-contrast`, `image-alt`,
`label`, `link-name`, `button-name`, `heading-order`, `landmark-one-main`,
`region`, `aria-valid-attr`, `tabindex`, `bypass`, `frame-title`,
`meta-viewport`, `valid-lang`, `duplicate-id-aria`, `list`, `listitem`.

## Recommended baseline

For a public site under WCAG 2.1 AA obligations, gate every page on:

```gherkin
Then the page should pass an accessibility audit at level "AA"
 And the page should have a title
 And the page should have a main landmark
 And the heading hierarchy should be valid
 And user zoom should be allowed
```

For an admin / authenticated UI where some third-party widgets are
known-bad, gate on the impact-based step instead:

```gherkin
Then the page should have no critical accessibility violations
 And the page should have no serious accessibility violations
```

Tag scenarios `@a11y` so CI can run the accessibility suite in
isolation: `npx cucumber-js --tags "@a11y"`.
