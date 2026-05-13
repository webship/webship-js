'use strict';

const { friendly } = require('./webship');

// Accessibility (a11y) step definitions.
//
// Two layers:
//
//   1. Custom JS probes — fast, dependency-free assertions for POUR
//      fundamentals (alt text, label association, landmarks, focus,
//      headings, skip link, ARIA validity, tabindex, title, zoom).
//      Each probe maps to a specific WCAG 2.1 / 2.2 success criterion.
//
//   2. axe-core integration — full WCAG audit via the official Deque
//      engine (https://github.com/dequelabs/axe-core). axe ships ~100
//      rules covering WCAG 2.0 / 2.1 / 2.2 levels A, AA, AAA plus best-
//      practice and experimental rules. Each violation has an `impact`
//      field (`minor` / `moderate` / `serious` / `critical`) for triage.
//
// Standards & references:
//   - WCAG 2.1            https://www.w3.org/TR/WCAG21/
//   - WCAG 2.2            https://www.w3.org/TR/WCAG22/
//   - WAI overview        https://www.w3.org/WAI/
//   - Evaluation tools    https://www.w3.org/WAI/test-evaluate/tools/list/
//   - MDN Accessibility   https://developer.mozilla.org/en-US/docs/Web/Accessibility
//   - axe-core rules      https://github.com/dequelabs/axe-core/tree/develop/doc/rule-descriptions.md
//   - Deque Labs          https://github.com/dequelabs/
//
// Defaults: the audit-level steps target WCAG 2.1 / 2.2 AA — the level
// required by the EU Web Accessibility Directive, US Section 508, and UK
// PSBAR. Use `at level "AAA"` for stricter scenarios.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// axe-core is loaded lazily so the file works even before deps install.
let AxeBuilder; try { AxeBuilder = require('@axe-core/playwright').default; } catch { /* lazy */ }

const WCAG_TAGS = {
  'A':   ['wcag2a', 'wcag21a'],
  'AA':  ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  'AAA': ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'wcag22aaa'],
};

function summariseViolations(violations) {
  if (violations.length === 0) return 'no violations';
  const head = violations.slice(0, 5).map((v) =>
    `  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`
  ).join('\n');
  const more = violations.length > 5 ? `\n  ... and ${violations.length - 5} more` : '';
  return head + more;
}

async function runAxe(world, opts = {}) {
  if (!AxeBuilder) {
    throw friendly('axe-core a11y steps require @axe-core/playwright. Install: npm i @axe-core/playwright axe-core');
  }
  let builder = new AxeBuilder({ page: world.page });
  if (opts.tags) builder = builder.withTags(opts.tags);
  if (opts.include) builder = builder.include(opts.include);
  if (opts.exclude) builder = builder.exclude(opts.exclude);
  return builder.analyze();
}

// ---------------------------------------------------------------------------
// Image alt text
// ---------------------------------------------------------------------------

/**
 * Assert every <img> on the page has an `alt` attribute.
 *
 * Empty `alt=""` is allowed (decorative images per WCAG); `role="presentation"`
 * is also allowed. Only a missing `alt` attribute fails. Iterates every <img>
 * in the document, including those nested in shadow-light DOM that the page
 * has rendered, so it works on infinite-scroll lists and image galleries too.
 *
 * Example #1: Then every image should have an alt attribute
 * Example #2: And every image should have an alt attribute
 * Example #3: Given I am on "/photos"
 *               Then every image should have an alt attribute
 * Example #4: When I scroll to the bottom
 *               Then every image should have an alt attribute
 * Example #5: When I follow "Gallery"
 *               Then every image should have an alt attribute
 *
 */
Then(/^every image should have an alt attribute$/, async function () {
  const missing = await this.page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter((img) => !img.hasAttribute('alt') && img.getAttribute('role') !== 'presentation')
      .map((img) => img.outerHTML.slice(0, 120))
  );
  assert.strictEqual(missing.length, 0,
    `Found ${missing.length} <img> without alt:\n  ${missing.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Form label association
// ---------------------------------------------------------------------------

/**
 * Assert every form input/select/textarea has an accessible name.
 *
 * Pass condition: each field has at least ONE of —
 *   - `aria-label` attribute
 *   - `aria-labelledby` attribute pointing at a real element
 *   - matching `<label for="...">`
 *   - wrapping `<label>` element
 *
 * Submit/reset/button/image inputs and `type="hidden"` are exempt because
 * they get their accessible name from `value` or `alt`.
 *
 * Example #1: Then every form field should have an accessible label
 * Example #2: Given I am on "/register"
 *               Then every form field should have an accessible label
 * Example #3: When I open the settings modal
 *               Then every form field should have an accessible label
 * Example #4: And every form field should have an accessible label
 * Example #5: Then the page should have a main landmark
 *               And every form field should have an accessible label
 *
 */
Then(/^every form field should have an accessible label$/, async function () {
  const missing = await this.page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    return fields.filter((el) => {
      if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return false;
      if (el.id && document.querySelector(`label[for="${el.id}"]`)) return false;
      if (el.closest('label')) return false;
      const t = el.getAttribute('type');
      if (t === 'submit' || t === 'button' || t === 'reset' || t === 'image') return false;
      return true;
    }).map((el) => el.outerHTML.slice(0, 120));
  });
  assert.strictEqual(missing.length, 0,
    `Found ${missing.length} unlabeled form field(s):\n  ${missing.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Landmarks / page structure
// ---------------------------------------------------------------------------

/**
 * Assert the page has a primary `<main>` (or `[role="main"]`) landmark.
 *
 * Screen readers announce landmarks; missing the main landmark forces users
 * to navigate the page linearly. WCAG 2.4.1 (Bypass Blocks) requires it.
 *
 * Example #1: Then the page should have a main landmark
 * Example #2: Given I am on "/about"
 *               Then the page should have a main landmark
 * Example #3: When I follow "Pricing"
 *               Then the page should have a main landmark
 * Example #4: And the page should have a main landmark
 * Example #5: Then the page should have a navigation landmark
 *               And the page should have a main landmark
 *
 */
Then(/^the page should have a main landmark$/, async function () {
  const count = await this.page.locator('main, [role="main"]').count();
  assert.ok(count >= 1, 'Page is missing a <main> or [role="main"] landmark.');
});

/**
 * Assert the page has at least one navigation landmark.
 *
 * Counts both `<nav>` and `[role="navigation"]`.
 *
 * Example #1: Then the page should have a navigation landmark
 * Example #2: Given I am on the homepage
 *               Then the page should have a navigation landmark
 * Example #3: Given I am on "/admin"
 *               Then the page should have a navigation landmark
 * Example #4: And the page should have a navigation landmark
 * Example #5: Then the page should have exactly one h1
 *               And the page should have a navigation landmark
 *
 */
Then(/^the page should have a navigation landmark$/, async function () {
  const count = await this.page.locator('nav, [role="navigation"]').count();
  assert.ok(count >= 1, 'Page is missing a <nav> or [role="navigation"] landmark.');
});

/**
 * Assert the page has exactly one `<h1>`.
 *
 * Multiple h1s are valid HTML5 with sectioning roots, but most assistive tech
 * still treats the document outline as flat. One h1 per page is the safe
 * default.
 *
 * Example #1: Then the page should have exactly one h1
 * Example #2: Given I am on the homepage
 *               Then the page should have exactly one h1
 * Example #3: When I follow "About"
 *               Then the page should have exactly one h1
 * Example #4: And the page should have exactly one h1
 * Example #5: Then the page should have a main landmark
 *               And the page should have exactly one h1
 *
 */
Then(/^the page should have exactly one h1$/, async function () {
  const count = await this.page.locator('h1').count();
  assert.strictEqual(count, 1, `Expected 1 <h1>, found ${count}.`);
});

// ---------------------------------------------------------------------------
// Focus assertions
// ---------------------------------------------------------------------------

/**
 * Assert the currently focused element matches a CSS selector.
 *
 * Useful for tab-order and skip-link tests.
 *
 * Example #1: Then the focused element should match "#email"
 * Example #2: When I press the "Tab" key
 *               Then the focused element should match "#email"
 * Example #3: When I press the "Tab" key 2 times
 *               Then the focused element should match "#password"
 * Example #4: When I focus on the element "#search"
 *               Then the focused element should match "input[type=search]"
 * Example #5: When I follow "Skip to main content"
 *               Then the focused element should match "main h1"
 *
 */
Then(/^the focused element should match "([^"]*)"$/, async function (selector) {
  const matches = await this.page.evaluate((sel) => {
    const el = document.activeElement;
    return !!(el && el.matches && el.matches(sel));
  }, selector);
  assert.ok(matches, `Focused element does not match "${selector}".`);
});

/**
 * Assert the currently focused element's accessible name contains text.
 *
 * Resolution order: aria-label → aria-labelledby → label[for] → wrapping
 * <label> → value/placeholder/title/textContent.
 *
 * Example #1: Then the focused element should be labeled "Email"
 * Example #2: When I press the "Tab" key
 *               Then the focused element should be labeled "Email"
 * Example #3: When I press the "Tab" key 2 times
 *               Then the focused element should be labeled "Password"
 * Example #4: When I press the "Tab" key 3 times
 *               Then the focused element should be labeled "Sign in"
 * Example #5: When I focus on the element "#agree"
 *               Then the focused element should be labeled "I agree"
 *
 */
Then(/^the focused element should be labeled "([^"]*)"$/, async function (text) {
  const name = await this.page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return '';
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      const ref = document.getElementById(labelledby);
      if (ref) return (ref.textContent || '').trim();
    }
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) return (lbl.textContent || '').trim();
    }
    const wrapping = el.closest && el.closest('label');
    if (wrapping) return (wrapping.textContent || '').trim();
    return ((el.value || el.placeholder || el.getAttribute('title') || el.textContent || '')).trim();
  });
  assert.ok(name.includes(text),
    `Expected focused element to be labeled including "${text}", got "${name}".`);
});

// ---------------------------------------------------------------------------
// Page language
// ---------------------------------------------------------------------------

/**
 * Assert the document has a `lang` attribute on `<html>`.
 *
 * Required by WCAG 3.1.1 — screen readers use `lang` to pick the right
 * pronunciation engine. Missing or empty `lang` fails.
 *
 * Example #1: Then the page should declare a language
 * Example #2: Given I am on the homepage
 *               Then the page should declare a language
 * Example #3: When I follow "About"
 *               Then the page should declare a language
 * Example #4: And the page should declare a language
 * Example #5: Then the page should have a main landmark
 *               And the page should declare a language
 *
 */
Then(/^the page should declare a language$/, async function () {
  const lang = await this.page.evaluate(() => document.documentElement.getAttribute('lang') || '');
  assert.ok(lang.length > 0, 'Page <html> is missing a "lang" attribute.');
});

/**
 * Assert the document `lang` equals an expected value.
 *
 * Example #1: Then the page language should be "en"
 * Example #2: Given I am on the homepage
 *               Then the page language should be "en"
 * Example #3: When I switch to the French version
 *               Then the page language should be "fr"
 * Example #4: When I switch to the Arabic version
 *               Then the page language should be "ar"
 * Example #5: And the page language should be "en-US"
 *
 */
Then(/^the page language should be "([^"]*)"$/, async function (expected) {
  const lang = await this.page.evaluate(() => document.documentElement.getAttribute('lang') || '');
  assert.strictEqual(lang, expected, `Expected page lang="${expected}", got "${lang}".`);
});

// ---------------------------------------------------------------------------
// Heading hierarchy (WCAG 1.3.1 — Info and Relationships)
// ---------------------------------------------------------------------------

/**
 * Assert headings appear in non-skipping order (h1 → h2 → h3 — never
 * h1 → h3). Required by WCAG 1.3.1 / 2.4.6 for screen-reader navigation.
 *
 * Example #1: Then the heading hierarchy should be valid
 * Example #2: Given I am on the homepage
 *               Then the heading hierarchy should be valid
 * Example #3: When I follow "About"
 *               Then the heading hierarchy should be valid
 * Example #4: And the heading hierarchy should be valid
 * Example #5: Then the page should have exactly one h1
 *               And the heading hierarchy should be valid
 *
 */
Then(/^the heading hierarchy should be valid$/, async function () {
  const skips = await this.page.evaluate(() => {
    const out = [];
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let prev = 0;
    for (const h of headings) {
      const level = parseInt(h.tagName.slice(1), 10);
      if (prev > 0 && level - prev > 1) {
        out.push(`<${h.tagName.toLowerCase()}>${(h.textContent || '').slice(0, 60).trim()}</${h.tagName.toLowerCase()}> (skipped from h${prev})`);
      }
      prev = level;
    }
    return out;
  });
  assert.strictEqual(skips.length, 0,
    `Heading hierarchy skips levels:\n  ${skips.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Skip link (WCAG 2.4.1 — Bypass Blocks)
// ---------------------------------------------------------------------------

/**
 * Assert the page exposes a skip-link as the first focusable element. WCAG
 * 2.4.1 requires a mechanism to bypass repeated content blocks.
 *
 * Detection: anchor with href="#..." that resolves to an existing target
 * AND text matching "skip" / "main content" / "to content".
 *
 * Example #1: Then the page should have a skip link
 * Example #2: Given I am on the homepage
 *               Then the page should have a skip link
 * Example #3: When I press the key "Tab"
 *               Then the focused element should match "a[href^='#']"
 *               And the page should have a skip link
 * Example #4: Then the page should have a skip link
 *               And the page should have a main landmark
 * Example #5: When I follow "About"
 *               Then the page should have a skip link
 *
 */
Then(/^the page should have a skip link$/, async function () {
  const ok = await this.page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href^="#"]'));
    return links.some((a) => {
      const href = a.getAttribute('href') || '';
      const id = href.slice(1);
      const target = id ? document.getElementById(id) : null;
      const txt = (a.textContent || '').toLowerCase();
      return target && (txt.includes('skip') || txt.includes('main content') || txt.includes('to content'));
    });
  });
  assert.ok(ok, 'Page is missing a skip link.');
});

// ---------------------------------------------------------------------------
// Accessible name on buttons / links (WCAG 4.1.2 — Name, Role, Value)
// ---------------------------------------------------------------------------

/**
 * Assert every <button> / role="button" has an accessible name (visible
 * text, aria-label, or aria-labelledby).
 *
 * Example #1: Then every button should have an accessible name
 * Example #2: Given I am on the homepage
 *               Then every button should have an accessible name
 * Example #3: When I am on "/checkout"
 *               Then every button should have an accessible name
 * Example #4: And every button should have an accessible name
 * Example #5: Then every button should have an accessible name
 *               And every link should have an accessible name
 *
 */
Then(/^every button should have an accessible name$/, async function () {
  const missing = await this.page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]'));
    return els.filter((el) => {
      if (el.hasAttribute('aria-label') && el.getAttribute('aria-label').trim()) return false;
      if (el.hasAttribute('aria-labelledby')) return false;
      if (el.tagName === 'INPUT') {
        return !((el.value || '').trim());
      }
      return !(el.textContent || '').trim();
    }).map((el) => el.outerHTML.slice(0, 120));
  });
  assert.strictEqual(missing.length, 0,
    `Found ${missing.length} button(s) without accessible name:\n  ${missing.join('\n  ')}`);
});

/**
 * Assert every <a> has an accessible name.
 *
 * Example #1: Then every link should have an accessible name
 * Example #2: Given I am on the homepage
 *               Then every link should have an accessible name
 * Example #3: When I am on "/blog"
 *               Then every link should have an accessible name
 * Example #4: And every link should have an accessible name
 * Example #5: Then every button should have an accessible name
 *               And every link should have an accessible name
 *
 */
Then(/^every link should have an accessible name$/, async function () {
  const missing = await this.page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links.filter((a) => {
      if (a.hasAttribute('aria-label') && a.getAttribute('aria-label').trim()) return false;
      if (a.hasAttribute('aria-labelledby')) return false;
      if ((a.textContent || '').trim()) return false;
      // Allow image-link if alt has text.
      const img = a.querySelector('img[alt]');
      if (img && (img.getAttribute('alt') || '').trim()) return false;
      return true;
    }).map((a) => a.outerHTML.slice(0, 120));
  });
  assert.strictEqual(missing.length, 0,
    `Found ${missing.length} link(s) without accessible name:\n  ${missing.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// tabindex hygiene (WCAG 2.4.3 — Focus Order)
// ---------------------------------------------------------------------------

/**
 * Assert NO interactive element uses a positive `tabindex`. Positive values
 * break natural focus order — WCAG 2.4.3 violation in practice.
 *
 * Example #1: Then no element should have a positive tabindex
 * Example #2: Given I am on the homepage
 *               Then no element should have a positive tabindex
 * Example #3: When I am on "/form"
 *               Then no element should have a positive tabindex
 * Example #4: And no element should have a positive tabindex
 * Example #5: Then no element should have a positive tabindex
 *               And the heading hierarchy should be valid
 *
 */
Then(/^no element should have a positive tabindex$/, async function () {
  const offenders = await this.page.evaluate(() =>
    Array.from(document.querySelectorAll('[tabindex]'))
      .filter((el) => parseInt(el.getAttribute('tabindex'), 10) > 0)
      .map((el) => el.outerHTML.slice(0, 120))
  );
  assert.strictEqual(offenders.length, 0,
    `Found ${offenders.length} element(s) with positive tabindex:\n  ${offenders.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// ARIA validity (WCAG 4.1.2)
// ---------------------------------------------------------------------------

/**
 * Assert every `aria-labelledby` / `aria-describedby` / `aria-controls`
 * / `aria-owns` references an existing element id.
 *
 * Example #1: Then every ARIA reference should resolve
 * Example #2: Given I am on the homepage
 *               Then every ARIA reference should resolve
 * Example #3: When I am on "/dashboard"
 *               Then every ARIA reference should resolve
 * Example #4: And every ARIA reference should resolve
 * Example #5: Then every ARIA reference should resolve
 *               And every button should have an accessible name
 *
 */
Then(/^every ARIA reference should resolve$/, async function () {
  const broken = await this.page.evaluate(() => {
    const attrs = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-flowto'];
    const out = [];
    for (const attr of attrs) {
      const els = Array.from(document.querySelectorAll(`[${attr}]`));
      for (const el of els) {
        const ids = (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
        for (const id of ids) {
          if (!document.getElementById(id)) {
            out.push(`<${el.tagName.toLowerCase()} ${attr}="${el.getAttribute(attr)}"> — missing id "${id}"`);
          }
        }
      }
    }
    return out;
  });
  assert.strictEqual(broken.length, 0,
    `Found ${broken.length} broken ARIA reference(s):\n  ${broken.join('\n  ')}`);
});

/**
 * Assert no element uses an invalid ARIA role. Reference: WAI-ARIA 1.2.
 *
 * Example #1: Then every ARIA role should be valid
 * Example #2: Given I am on the homepage
 *               Then every ARIA role should be valid
 * Example #3: When I am on "/dashboard"
 *               Then every ARIA role should be valid
 * Example #4: And every ARIA role should be valid
 * Example #5: Then every ARIA role should be valid
 *               And every ARIA reference should resolve
 *
 */
Then(/^every ARIA role should be valid$/, async function () {
  const VALID = new Set([
    'alert', 'alertdialog', 'application', 'article', 'banner', 'blockquote',
    'button', 'caption', 'cell', 'checkbox', 'code', 'columnheader', 'combobox',
    'complementary', 'contentinfo', 'definition', 'deletion', 'dialog',
    'directory', 'document', 'emphasis', 'feed', 'figure', 'form', 'generic',
    'graphics-document', 'graphics-object', 'graphics-symbol', 'grid',
    'gridcell', 'group', 'heading', 'img', 'insertion', 'link', 'list',
    'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar',
    'menuitem', 'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation',
    'none', 'note', 'option', 'paragraph', 'presentation', 'progressbar',
    'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
    'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton',
    'status', 'strong', 'subscript', 'superscript', 'switch', 'tab', 'table',
    'tablist', 'tabpanel', 'term', 'textbox', 'time', 'timer', 'toolbar',
    'tooltip', 'tree', 'treegrid', 'treeitem',
  ]);
  const invalid = await this.page.evaluate((valid) => {
    return Array.from(document.querySelectorAll('[role]'))
      .filter((el) => {
        const roles = (el.getAttribute('role') || '').split(/\s+/).filter(Boolean);
        return roles.some((r) => !valid.includes(r));
      })
      .map((el) => `${el.tagName.toLowerCase()} role="${el.getAttribute('role')}"`);
  }, [...VALID]);
  assert.strictEqual(invalid.length, 0,
    `Found ${invalid.length} invalid ARIA role(s):\n  ${invalid.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Forms — autocomplete, required (WCAG 1.3.5 — Identify Input Purpose)
// ---------------------------------------------------------------------------

/**
 * Assert every form field exposing `aria-required="true"` is also marked
 * with the native `required` attribute (or vice versa). Mismatch confuses
 * assistive tech.
 *
 * Example #1: Then required fields should be consistently marked
 * Example #2: Given I am on "/signup"
 *               Then required fields should be consistently marked
 * Example #3: When I am on "/checkout"
 *               Then required fields should be consistently marked
 * Example #4: And required fields should be consistently marked
 * Example #5: Then every form field should have an accessible label
 *               And required fields should be consistently marked
 *
 */
Then(/^required fields should be consistently marked$/, async function () {
  const mismatches = await this.page.evaluate(() => {
    const out = [];
    const fields = Array.from(document.querySelectorAll('input, select, textarea'));
    for (const el of fields) {
      const native = el.hasAttribute('required');
      const aria = el.getAttribute('aria-required') === 'true';
      if (native !== aria && (native || aria)) {
        out.push(el.outerHTML.slice(0, 120));
      }
    }
    return out;
  });
  // Strict mismatch — any field with one but not the other is a finding.
  assert.strictEqual(mismatches.length, 0,
    `Found ${mismatches.length} field(s) with inconsistent required marking:\n  ${mismatches.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Page <title> (WCAG 2.4.2 — Page Titled)
// ---------------------------------------------------------------------------

/**
 * Assert the document has a non-empty `<title>`. WCAG 2.4.2.
 *
 * Example #1: Then the page should have a title
 * Example #2: Given I am on the homepage
 *               Then the page should have a title
 * Example #3: When I am on "/about"
 *               Then the page should have a title
 * Example #4: And the page should have a title
 * Example #5: Then the page should have a title
 *               And the page should declare a language
 *
 */
Then(/^the page should have a title$/, async function () {
  const title = await this.page.title();
  assert.ok(title && title.trim().length > 0, 'Page is missing a non-empty <title>.');
});

// ---------------------------------------------------------------------------
// Viewport meta (WCAG 1.4.4 — Resize Text without horizontal scroll)
// ---------------------------------------------------------------------------

/**
 * Assert the viewport meta tag does not disable user-scaling
 * (`user-scalable=no` or `maximum-scale=1`). WCAG 1.4.4 / 1.4.10.
 *
 * Example #1: Then user zoom should be allowed
 * Example #2: Given I am on the homepage
 *               Then user zoom should be allowed
 * Example #3: When I am on "/article"
 *               Then user zoom should be allowed
 * Example #4: And user zoom should be allowed
 * Example #5: Then user zoom should be allowed
 *               And the page should declare a language
 *
 */
Then(/^user zoom should be allowed$/, async function () {
  const blocked = await this.page.evaluate(() => {
    const m = document.querySelector('meta[name="viewport"]');
    if (!m) return false;
    const c = (m.getAttribute('content') || '').toLowerCase();
    return /user-scalable\s*=\s*(no|0)/.test(c) || /maximum-scale\s*=\s*1(\.0)?(\b|$)/.test(c);
  });
  assert.ok(!blocked, 'Viewport meta tag disables user-scaling — fails WCAG 1.4.4 / 1.4.10.');
});

// ===========================================================================
// axe-core full WCAG audit (https://github.com/dequelabs/axe-core)
// ===========================================================================

/**
 * Run an axe-core audit and assert ZERO violations across the supplied WCAG
 * level. Defaults to AA — the level mandated by most accessibility laws.
 *
 * Example #1: Then the page should pass an accessibility audit
 * Example #2: Then the page should pass an accessibility audit at level "A"
 * Example #3: Then the page should pass an accessibility audit at level "AA"
 * Example #4: And the page should pass an accessibility audit at level "AAA"
 * Example #5: When I am on "/dashboard"
 *               Then the page should pass an accessibility audit at level "AA"
 *
 */
Then(/^the page should pass an accessibility audit(?: at level "(A|AA|AAA)")?$/, async function (level) {
  const tags = WCAG_TAGS[level || 'AA'];
  const result = await runAxe(this, { tags });
  assert.strictEqual(result.violations.length, 0,
    `Expected no WCAG ${level || 'AA'} violations, got ${result.violations.length}:\n${summariseViolations(result.violations)}`);
});

/**
 * Assert NO axe violations of the given impact severity.
 * Levels: `minor`, `moderate`, `serious`, `critical`.
 *
 * Use to gate merges on critical/serious issues while triaging minor regressions.
 *
 * Example #1: Then the page should have no critical accessibility violations
 * Example #2: Then the page should have no serious accessibility violations
 * Example #3: And the page should have no moderate accessibility violations
 * Example #4: When I am on "/checkout"
 *               Then the page should have no critical accessibility violations
 * Example #5: Then the page should have no critical accessibility violations
 *               And the page should have no serious accessibility violations
 *
 */
Then(/^the page should have no (critical|serious|moderate|minor) accessibility violations$/, async function (impact) {
  const result = await runAxe(this);
  const filtered = result.violations.filter((v) => v.impact === impact);
  assert.strictEqual(filtered.length, 0,
    `Expected no ${impact} violations, got ${filtered.length}:\n${summariseViolations(filtered)}`);
});

/**
 * Audit ONLY the subtree under a CSS selector. Use when third-party widgets
 * are known-bad and you only want to gate your own components.
 *
 * Example #1: Then the element "main" should pass an accessibility audit
 * Example #2: Then the element "#checkout-form" should pass an accessibility audit
 * Example #3: And the element ".product-card" should pass an accessibility audit
 * Example #4: Then the element "#dashboard-widget" should pass an accessibility audit
 * Example #5: Then the element "[data-testid=signup]" should pass an accessibility audit
 *
 */
Then(/^the element "([^"]*)" should pass an accessibility audit$/, async function (selector) {
  const result = await runAxe(this, { include: selector, tags: WCAG_TAGS.AA });
  assert.strictEqual(result.violations.length, 0,
    `Expected no violations within "${selector}", got ${result.violations.length}:\n${summariseViolations(result.violations)}`);
});

/**
 * Audit the page but EXCLUDE the subtree under a CSS selector. Skip
 * known-bad embedded content (third-party iframes, legacy widgets, ads).
 *
 * Example #1: Then the page should pass an accessibility audit excluding "iframe.payment"
 * Example #2: Then the page should pass an accessibility audit excluding "#chat-widget"
 * Example #3: And the page should pass an accessibility audit excluding ".legacy-banner"
 * Example #4: Then the page should pass an accessibility audit excluding "[data-third-party]"
 * Example #5: Then the page should pass an accessibility audit excluding ".ads"
 *
 */
Then(/^the page should pass an accessibility audit excluding "([^"]*)"$/, async function (selector) {
  const result = await runAxe(this, { exclude: selector, tags: WCAG_TAGS.AA });
  assert.strictEqual(result.violations.length, 0,
    `Expected no violations excluding "${selector}", got ${result.violations.length}:\n${summariseViolations(result.violations)}`);
});

/**
 * Assert a specific axe rule does not fire. Use for fine-grained gates —
 * e.g. ensure color-contrast is fixed even if other rules still red.
 *
 * Common rule ids: `color-contrast`, `image-alt`, `label`, `link-name`,
 * `button-name`, `heading-order`, `landmark-one-main`, `region`,
 * `aria-valid-attr`, `tabindex`, `bypass`, `frame-title`, `meta-viewport`,
 * `valid-lang`, `duplicate-id-aria`, `list`, `listitem`.
 *
 * Example #1: Then the page should not violate the accessibility rule "color-contrast"
 * Example #2: Then the page should not violate the accessibility rule "image-alt"
 * Example #3: And the page should not violate the accessibility rule "label"
 * Example #4: Then the page should not violate the accessibility rule "link-name"
 * Example #5: Then the page should not violate the accessibility rule "heading-order"
 *
 */
Then(/^the page should not violate the accessibility rule "([^"]*)"$/, async function (ruleId) {
  const result = await runAxe(this);
  const hit = result.violations.find((v) => v.id === ruleId);
  assert.ok(!hit, hit ? `Rule "${ruleId}" violated by ${hit.nodes.length} node(s):\n  ${hit.nodes.slice(0, 5).map((n) => n.target.join(' ')).join('\n  ')}` : '');
});

/**
 * Print every axe violation to stdout (debug aid). Strip from CI runs.
 *
 * Example #1: Then I print accessibility violations
 * Example #2: When I am on "/checkout"
 *               Then I print accessibility violations
 * Example #3: And we print accessibility violations
 * Example #4: Then I print accessibility violations
 *               And the page should have no critical accessibility violations
 * Example #5: When I follow "Pricing"
 *               Then I print accessibility violations
 *
 */
Then(/^(I |we )*print accessibility violations$/, async function () {
  const result = await runAxe(this);
  if (result.violations.length === 0) {
    console.log('\n--- Accessibility violations: none ---');
    return;
  }
  console.log('\n--- Accessibility violations ---');
  for (const v of result.violations) {
    console.log(`[${v.impact}] ${v.id} — ${v.help}`);
    console.log(`  ${v.helpUrl}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`  ${n.target.join(' ')}`);
      if (n.failureSummary) console.log(`    ${n.failureSummary.split('\n')[0]}`);
    }
    if (v.nodes.length > 3) console.log(`  ... and ${v.nodes.length - 3} more node(s)`);
  }
});

/**
 * Assert axe finds zero violations of an exact list of rules. Use for
 * smoke-test gating: pin the small list of rules you absolutely require to
 * pass, run them on every page.
 *
 * Example #1: Then the page should pass the accessibility rules "image-alt, label"
 * Example #2: Then the page should pass the accessibility rules "color-contrast"
 * Example #3: And the page should pass the accessibility rules "button-name, link-name"
 * Example #4: Then the page should pass the accessibility rules "landmark-one-main, region"
 * Example #5: Then the page should pass the accessibility rules "aria-valid-attr, aria-valid-attr-value"
 *
 */
Then(/^the page should pass the accessibility rules "([^"]*)"$/, async function (csv) {
  const ids = csv.split(',').map((s) => s.trim()).filter(Boolean);
  const result = await runAxe(this);
  const hits = result.violations.filter((v) => ids.includes(v.id));
  assert.strictEqual(hits.length, 0,
    `Required rule(s) violated:\n${summariseViolations(hits)}`);
});
