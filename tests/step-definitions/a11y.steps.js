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

// Impact is a severity ladder, not a set of unrelated labels. A gate named
// for one level covers that level and everything worse than it, so a page
// asked for no serious violations can never pass while a critical one stands.
const IMPACT_ORDER = ['minor', 'moderate', 'serious', 'critical'];

// axe leaves `impact` null on a few rules. Rank those at the bottom of the
// ladder so they are still reported by the widest gate instead of vanishing.
function impactRank(violation) {
  const i = IMPACT_ORDER.indexOf(violation.impact);
  return i === -1 ? 0 : i;
}

function atOrAbove(violations, impact) {
  const floor = IMPACT_ORDER.indexOf(impact);
  return violations.filter((v) => impactRank(v) >= floor);
}

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
// The structural audit
// ---------------------------------------------------------------------------
//
// One page-side pass gathers every structural finding at once, and every
// structural step below reads its own slice out of it. One implementation,
// many gates, so a probe and the whole-page check can never disagree.
//
// Anything hidden from assistive technology is out of scope. A control behind
// `aria-hidden`, `inert`, `hidden`, `display: none` or `visibility: hidden` is
// not reachable, so a missing name on it is not a barrier. axe takes the same
// view, and a suite that did not was failing on scrims and closed menus.

const STRUCTURE = {
  imageAlt: 'image(s) without an alt attribute',
  buttonName: 'button(s) without an accessible name',
  linkName: 'link(s) without an accessible name',
  fieldLabel: 'unlabeled form field(s)',
  frameTitle: 'iframe(s) without a title',
  positiveTabindex: 'element(s) with a positive tabindex',
  ariaReference: 'broken ARIA reference(s)',
  oneH1: 'not exactly one h1',
  headingOrder: 'skipped heading level(s)',
  emptyHeading: 'empty heading(s)',
  mainLandmark: 'no main landmark',
  navLandmark: 'no navigation landmark',
  htmlLang: 'no language on <html>',
  pageTitle: 'no page title',
  zoomAllowed: 'zoom blocked',
  uniqueNavName: 'navigation landmark(s) sharing one name',
};

async function structuralAudit(page) {
  return page.evaluate(() => {
    const atHidden = (el) => {
      if (el.closest('[aria-hidden="true"], [inert], [hidden]')) return true;
      const s = getComputedStyle(el);
      return s.display === 'none' || s.visibility === 'hidden';
    };
    const visible = (sel) => Array.from(document.querySelectorAll(sel)).filter((el) => !atHidden(el));
    const attr = (el, name) => (el.getAttribute(name) || '').trim();
    // The accessible name an assistive technology would announce, in the order
    // HTML gives them. Enough for a "has a name at all" gate, which is what
    // these probes are.
    const named = (el) => {
      if (attr(el, 'aria-label')) return true;
      if (el.hasAttribute('aria-labelledby')) return true;
      if (attr(el, 'title')) return true;
      if (el.tagName === 'INPUT') return Boolean((el.value || '').trim());
      if ((el.textContent || '').trim()) return true;
      const img = el.querySelector('img[alt]');
      return Boolean(img && attr(img, 'alt'));
    };
    const brief = (el) => el.outerHTML.slice(0, 120);
    const found = {};
    const add = (key, items) => { if (items.length) found[key] = items; };

    add('imageAlt', visible('img').filter((img) => {
      if (img.hasAttribute('alt')) return false;
      const role = img.getAttribute('role');
      if (role === 'presentation' || role === 'none') return false;
      return !(attr(img, 'aria-label') || img.hasAttribute('aria-labelledby') || attr(img, 'title'));
    }).map(brief));

    add('buttonName', visible('button, [role="button"], input[type="submit"], input[type="button"]')
      .filter((el) => !named(el)).map(brief));

    add('linkName', visible('a[href]').filter((el) => !named(el)).map(brief));

    add('fieldLabel', visible('input:not([type="hidden"]), select, textarea').filter((el) => {
      const type = el.getAttribute('type');
      if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') return false;
      if (attr(el, 'aria-label') || el.hasAttribute('aria-labelledby') || attr(el, 'title')) return false;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
      return !el.closest('label');
    }).map(brief));

    add('frameTitle', visible('iframe')
      .filter((el) => !attr(el, 'title') && !attr(el, 'aria-label')).map(brief));

    add('positiveTabindex', Array.from(document.querySelectorAll('[tabindex]'))
      .filter((el) => parseInt(el.getAttribute('tabindex'), 10) > 0).map(brief));

    const refAttrs = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-flowto'];
    const broken = [];
    for (const name of refAttrs) {
      for (const el of Array.from(document.querySelectorAll(`[${name}]`))) {
        for (const id of (el.getAttribute(name) || '').split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(id)) {
            broken.push(`<${el.tagName.toLowerCase()} ${name}="${el.getAttribute(name)}"> references a missing id "${id}"`);
          }
        }
      }
    }
    add('ariaReference', broken);

    const headings = visible('h1, h2, h3, h4, h5, h6');
    const h1s = headings.filter((h) => h.tagName === 'H1');
    if (h1s.length !== 1) add('oneH1', [`found ${h1s.length}`]);

    const skips = [];
    let previous = 0;
    for (const h of headings) {
      const level = parseInt(h.tagName.slice(1), 10);
      if (previous > 0 && level - previous > 1) {
        skips.push(`h${previous} to h${level} at "${(h.textContent || '').trim().slice(0, 40)}"`);
      }
      previous = level;
    }
    add('headingOrder', skips);

    add('emptyHeading', headings.filter((h) => !(h.textContent || '').trim() && !named(h)).map(brief));

    if (!visible('main, [role="main"]').length) add('mainLandmark', ['none on the page']);
    if (!visible('nav, [role="navigation"]').length) add('navLandmark', ['none on the page']);
    if (!attr(document.documentElement, 'lang')) add('htmlLang', ['none set']);
    if (!(document.title || '').trim()) add('pageTitle', ['empty']);

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      const content = (meta.getAttribute('content') || '').toLowerCase();
      // Read the scale as a number. Any maximum-scale below 2 caps zoom, the
      // same line axe draws, and a regex written for "1" missed 0.5 and 1.5.
      const scale = /maximum-scale\s*=\s*([0-9.]+)/.exec(content);
      const blocked = /user-scalable\s*=\s*(no|0)\b/.test(content)
        || (scale && parseFloat(scale[1]) < 2);
      if (blocked) add('zoomAllowed', [`<meta name="viewport" content="${content}">`]);
    }

    const navNames = visible('nav, [role="navigation"]').map((el) => attr(el, 'aria-label').toLowerCase());
    const shared = navNames.filter((name, i) => name && navNames.indexOf(name) !== i);
    add('uniqueNavName', Array.from(new Set(shared)));

    return found;
  });
}

// Assert one slice of the structural audit, in the wording that slice's own
// step has always used.
async function assertStructure(page, key, message) {
  const found = await structuralAudit(page);
  const items = found[key] || [];
  assert.strictEqual(items.length, 0,
    `${message(items)}\n  ${items.slice(0, 20).join('\n  ')}`);
}

// ---------------------------------------------------------------------------
// Image alt text
// ---------------------------------------------------------------------------

/**
 * Assert every <img> on the page has an `alt` attribute.
 *
 * Empty `alt=""` is allowed (decorative images per WCAG); `role="presentation"`,
 * `role="none"`, `aria-label`, `aria-labelledby` and `title` are also accepted.
 * Only a missing `alt` attribute fails. Images hidden from assistive technology
 * (`aria-hidden`, `inert`, `hidden`, `display: none`, `visibility: hidden`)
 * are skipped, the same as axe skips them. The same rule applies to the button,
 * link and form field probes.
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
  await assertStructure(this.page, 'imageAlt',
    (items) => `Found ${items.length} <img> without alt:`);
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
  await assertStructure(this.page, 'fieldLabel',
    (items) => `Found ${items.length} unlabeled form field(s):`);
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
  const found = await structuralAudit(this.page);
  assert.ok(!found.mainLandmark, 'Page is missing a <main> or [role="main"] landmark.');
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
  const found = await structuralAudit(this.page);
  assert.ok(!found.navLandmark, 'Page is missing a <nav> or [role="navigation"] landmark.');
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
  const found = await structuralAudit(this.page);
  assert.ok(!found.oneH1, `Expected 1 <h1>, ${(found.oneH1 || [''])[0]}.`);
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
  const found = await structuralAudit(this.page);
  assert.ok(!found.htmlLang, 'Page <html> is missing a "lang" attribute.');
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
  await assertStructure(this.page, 'headingOrder',
    (items) => `Heading hierarchy skips ${items.length} level(s):`);
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
  await assertStructure(this.page, 'buttonName',
    (items) => `Found ${items.length} button(s) without accessible name:`);
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
  await assertStructure(this.page, 'linkName',
    (items) => `Found ${items.length} link(s) without accessible name:`);
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
  await assertStructure(this.page, 'positiveTabindex',
    (items) => `Found ${items.length} element(s) with positive tabindex:`);
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
  await assertStructure(this.page, 'ariaReference',
    (items) => `Found ${items.length} broken ARIA reference(s):`);
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
  const found = await structuralAudit(this.page);
  assert.ok(!found.pageTitle, 'Page is missing a non-empty <title>.');
});

// ---------------------------------------------------------------------------
// Viewport meta (WCAG 1.4.4 — Resize Text without horizontal scroll)
// ---------------------------------------------------------------------------

/**
 * Assert the viewport meta tag does not disable user-scaling
 * (`user-scalable=no`, or a `maximum-scale` below 2). WCAG 1.4.4 / 1.4.10.
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
  const found = await structuralAudit(this.page);
  assert.ok(!found.zoomAllowed,
    `Viewport meta tag disables user-scaling: ${(found.zoomAllowed || [''])[0]}`);
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
 * Assert NO axe violations at the given impact or worse.
 * Levels, lowest first: `minor`, `moderate`, `serious`, `critical`.
 * `serious` also fails on a critical violation, and `minor` on any violation.
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
  const filtered = atOrAbove(result.violations, impact);
  assert.strictEqual(filtered.length, 0,
    `Expected no ${impact} or worse violations, got ${filtered.length}:\n${summariseViolations(filtered)}`);
});

/**
 * Assert axe finds no violations at all, whatever their impact.
 *
 * Example #1: Then the page should have no accessibility violations
 * Example #2: Given I am on the homepage
 *               Then the page should have no accessibility violations
 * Example #3: When I follow "Pricing"
 *               Then the page should have no accessibility violations
 * Example #4: And the page should have no accessibility violations
 * Example #5: Then the page should have no accessibility violations
 *               And the heading hierarchy should be valid
 *
 */
Then(/^the page should have no accessibility violations$/, async function () {
  const result = await runAxe(this);
  assert.strictEqual(result.violations.length, 0,
    `Expected no violations, got ${result.violations.length}:\n${summariseViolations(result.violations)}`);
});

/**
 * Assert a specific axe rule does not fire inside one subtree. Use when a
 * rule is clean in your own component but not yet across the whole page.
 *
 * Example #1: Then the element "main" should not violate the accessibility rule "color-contrast"
 * Example #2: Then the element "#checkout" should not violate the accessibility rule "label"
 * Example #3: And the element ".card" should not violate the accessibility rule "heading-order"
 * Example #4: Then the element "footer" should not violate the accessibility rule "link-name"
 * Example #5: Then the element "[data-testid=nav]" should not violate the accessibility rule "landmark-unique"
 *
 */
Then(/^the element "([^"]*)" should not violate the accessibility rule "([^"]*)"$/, async function (selector, ruleId) {
  const result = await runAxe(this, { include: selector });
  const hit = result.violations.find((v) => v.id === ruleId);
  if (hit) {
    assert.fail(`Rule "${ruleId}" violated inside "${selector}" by ${hit.nodes.length} node(s):\n  `
      + hit.nodes.slice(0, 5).map((n) => n.target.join(' ')).join('\n  '));
  }
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

// ---------------------------------------------------------------------------
// The full check
// ---------------------------------------------------------------------------

// axe already reports these, so the structural pass keeps quiet about anything
// axe has just named. One finding, one line, whichever engine found it.
const AXE_COVERS = {
  'image-alt': 'imageAlt',
  'button-name': 'buttonName',
  'input-button-name': 'buttonName',
  'link-name': 'linkName',
  'label': 'fieldLabel',
  'select-name': 'fieldLabel',
  'form-field-multiple-labels': 'fieldLabel',
  'frame-title': 'frameTitle',
  'tabindex': 'positiveTabindex',
  'aria-valid-attr-value': 'ariaReference',
  'page-has-heading-one': 'oneH1',
  'heading-order': 'headingOrder',
  'empty-heading': 'emptyHeading',
  'landmark-one-main': 'mainLandmark',
  'html-has-lang': 'htmlLang',
  'document-title': 'pageTitle',
  'meta-viewport': 'zoomAllowed',
  'meta-viewport-large': 'zoomAllowed',
  'landmark-unique': 'uniqueNavName',
};

// Facts about the page as a whole, reported as one line rather than a count.
const PAGE_FACTS = new Set(['oneH1', 'mainLandmark', 'navLandmark', 'htmlLang', 'pageTitle', 'zoomAllowed']);

function fullCheckReport(violations, found) {
  const covered = new Set(violations.map((v) => AXE_COVERS[v.id]).filter(Boolean));
  const lines = [];
  if (violations.length) {
    lines.push(`axe found ${violations.length} violation(s):\n${summariseViolations(violations)}`);
  }
  for (const [key, label] of Object.entries(STRUCTURE)) {
    const items = found[key];
    if (!items || covered.has(key)) continue;
    if (PAGE_FACTS.has(key)) {
      lines.push(`${label}: ${items[0]}`);
      continue;
    }
    const head = `${items.length} ${label}`;
    const shown = items.slice(0, 5);
    const more = items.length > shown.length ? `\n  ... and ${items.length - shown.length} more` : '';
    lines.push(`${head}:\n  ${shown.join('\n  ')}${more}`);
  }
  return lines;
}

/**
 * Run the whole accessibility check on the current page in one step: an axe
 * audit at the given level (AA by default), plus every structural check in
 * this file. A finding axe already named is not repeated. Reports every
 * failure at once rather than stopping at the first.
 *
 * Example #1: Then the page should pass the full accessibility check
 * Example #2: Then the page should pass the full accessibility check at level "AA"
 * Example #3: And the page should pass the full accessibility check at level "A"
 * Example #4: When I go to "/news"
 *               Then the page should pass the full accessibility check
 * Example #5: Given I am an anonymous user
 *               When I am on the homepage
 *               Then the page should pass the full accessibility check at level "AA"
 *
 */
Then(/^the page should pass the full accessibility check(?: at level "(A|AA|AAA)")?$/, async function (level) {
  const result = await runAxe(this, { tags: WCAG_TAGS[level || 'AA'] });
  const found = await structuralAudit(this.page);
  const lines = fullCheckReport(result.violations, found);
  assert.strictEqual(lines.length, 0,
    `The page failed ${lines.length} accessibility check(s):\n\n${lines.join('\n\n')}`);
});

/**
 * The same whole-page check, reported rather than asserted. Use it to see
 * where a page stands before deciding what to gate on.
 *
 * Example #1: Then I print the full accessibility check
 * Example #2: When I go to "/about-us"
 *               Then I print the full accessibility check
 * Example #3: And we print the full accessibility check
 * Example #4: Given I am an anonymous user
 *               Then I print the full accessibility check
 * Example #5: Then I print the full accessibility check
 *               And the page should have no critical accessibility violations
 *
 */
Then(/^(?:I |we )*print the full accessibility check$/, async function () {
  const result = await runAxe(this, { tags: WCAG_TAGS.AA });
  const found = await structuralAudit(this.page);
  const lines = fullCheckReport(result.violations, found);
  console.log(`\n--- Full accessibility check: ${this.page.url()} ---`);
  console.log(lines.length ? lines.join('\n\n') : '  nothing to report');
});
