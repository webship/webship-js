'use strict';

// Form field assertions and interactions.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { friendly, failure, fillLocator, humanize, isTimeout } = require('./webship');

// Resolve a field by label, name, id, or selector.
function fieldLocator(page, field) {
  if (field.startsWith('#') || field.startsWith('.') || field.startsWith('[')) {
    return page.locator(field).first();
  }
  // Try label, then by name/id.
  return page.locator(
    `label:has-text("${field}") >> xpath=..//input | label:has-text("${field}") >> xpath=..//textarea | label:has-text("${field}") >> xpath=..//select, [name="${field}"], #${field}`
  ).first().or(page.getByLabel(field).first());
}

async function getField(page, field) {
  // Prefer Playwright's accessible getByLabel; fallback to name/id/CSS.
  if (field.startsWith('#') || field.startsWith('.') || field.startsWith('[')) {
    return page.locator(field).first();
  }
  let loc = page.getByLabel(field).first();
  if (await loc.count() > 0) return loc;
  loc = page.locator(`[name="${field}"], #${field}`).first();
  return loc;
}

// Find, in the page, the date or the time input of the datetime field named
// `label`, and return a CSS path to it (null when there is none yet). The
// field is looked for in this order, and the first that has such an input
// wins:
//   1. a <label> whose text is the label (white space and letter case aside):
//      an input inside it, the control it is for, else the inputs that follow
//      it in its own field: up to the next label, legend or fieldset of the
//      same level, within the container it shares with its control (or its
//      parent; a label alone in its wrapper reads the wrapper's next siblings);
//   2. a <fieldset> whose <legend> is the label: the inputs inside it;
//   3. an input whose name, then whose aria-label, contains the label.
// `half` narrows a date range to its "start" or its "end" input (by name, id
// or aria-label).
function findDatetimeInput({ label, type, half }) {
  const norm = (text) => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const wanted = norm(label);
  const halfOk = (el) => !half || [el.name, el.id, el.getAttribute('aria-label')].some((v) => String(v || '').toLowerCase().includes(half));
  const fits = (el) => !!el && el.nodeType === 1 && el.matches(`input[type="${type}"]`) && halfOk(el);
  const inside = (root) => Array.from(root.querySelectorAll(`input[type="${type}"]`)).filter(halfOk);
  const follows = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const BOUNDARY = 'label, legend, fieldset';

  // The inputs after `start`, within `box`, up to the next label, legend or
  // fieldset that is not nested deeper than `start` (another field).
  function after(start, box) {
    const all = Array.from(box.querySelectorAll(`input[type="${type}"], ${BOUNDARY}`));
    for (const el of all) {
      if (el === start || start.contains(el) || !follows(start, el)) continue;
      if (el.matches(BOUNDARY)) {
        if (el.parentElement && el.parentElement.contains(start)) return null;
        continue;
      }
      if (fits(el)) return el;
    }
    return null;
  }

  function inField(lab) {
    const own = inside(lab);
    if (own.length) return own[0];
    const control = lab.control;
    if (fits(control)) return control;
    if (control) {
      let box = control.parentElement;
      while (box && !box.contains(lab)) box = box.parentElement;
      if (box) return after(lab, box);
    }
    let unit = lab;
    for (let level = 0; level < 3 && unit.parentElement && unit.parentElement !== document.body; level += 1) {
      const found = after(unit, unit.parentElement);
      if (found || unit.nextElementSibling) return found;
      unit = unit.parentElement;
    }
    return null;
  }

  function pathTo(el) {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && node !== document.documentElement; node = node.parentElement) {
      let index = 1;
      for (let sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
        if (sib.tagName === node.tagName) index += 1;
      }
      parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${index})`);
    }
    return 'html > ' + parts.join(' > ');
  }

  for (const lab of document.querySelectorAll('label')) {
    if (norm(lab.textContent) !== wanted) continue;
    const found = inField(lab);
    if (found) return pathTo(found);
  }
  for (const legend of document.querySelectorAll('fieldset > legend')) {
    if (norm(legend.textContent) !== wanted) continue;
    const found = inside(legend.parentElement)[0];
    if (found) return pathTo(found);
  }
  const all = Array.from(document.querySelectorAll(`input[type="${type}"]`)).filter(halfOk);
  const byName = all.find((el) => norm(el.name).includes(wanted));
  if (byName) return pathTo(byName);
  const byAria = all.find((el) => norm(el.getAttribute('aria-label')).includes(wanted));
  return byAria ? pathTo(byAria) : null;
}

// Resolve the date or the time input of a datetime field named by its label
// (see findDatetimeInput), waiting up to 5 seconds for it.
async function datetimePart(page, label, type, half) {
  const deadline = Date.now() + 5000;
  for (;;) {
    const path = await page.evaluate(findDatetimeInput, { label, type, half: half || null }).catch(() => null);
    if (path) return page.locator(path);
    if (Date.now() >= deadline) break;
    await page.waitForTimeout(100);
  }
  throw failure(page, `The datetime field "${label}" has no ${half ? half + ' ' : ''}${type} input.`, {
    hint: `the field is named by the exact text of its label or of the legend of its fieldset; its ${type} input is the one inside the label, the one the label is for, or one that follows the label before the next field. An input whose name or aria-label contains "${label}" is found too.`,
  });
}

// The checkbox, radio button and field steps find a control by a CSS
// selector, the exact text of its label, its name, its id or (a checkbox or a
// radio button) its value. A radio button is not found by its name: the name
// is shared by its whole group.
const CONTROLS = {
  checkbox: {
    css: 'input[type="checkbox"], [role="checkbox"]',
    noun: 'checkbox', state: 'checked', by: ['name', 'id', 'value'],
    says: 'the label, the name, the id or the selector',
  },
  radio: {
    css: 'input[type="radio"], [role="radio"]',
    noun: 'radio button', state: 'selected', by: ['id', 'value'],
    says: 'the label, the id, the value or the selector',
  },
  field: {
    css: 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select',
    noun: 'field', by: ['name', 'id'],
    says: 'the label, the name, the id or the selector',
  },
};

/**
 * Find the checkbox, radio button or field a step names, waiting up to 5
 * seconds for it; fail the step plainly when there is none.
 *
 * @param {import('playwright').Page} page
 * @param {string} name - A CSS selector, or the label, name, id or value.
 * @param {'checkbox'|'radio'|'field'} kind
 * @returns {Promise<import('playwright').Locator>}
 */
async function locateControl(page, name, kind) {
  const spec = CONTROLS[kind];
  const q = String(name).replace(/["\\]/g, '\\$&');
  const ofKind = page.locator(spec.css);
  let named = page.getByLabel(name, { exact: true }).and(ofKind);
  for (const attr of spec.by) named = named.or(ofKind.and(page.locator(`[${attr}="${q}"]`)));
  // A name that is not a valid selector is left out of the search instead of
  // failing it.
  for (const loc of [named.or(page.locator(name)).first(), named.first()]) {
    try {
      await loc.waitFor({ state: 'attached', timeout: 5000 });
      return loc;
    } catch (e) {
      if (isTimeout(e)) break;
    }
  }
  throw failure(page, `No ${spec.noun} with ${spec.says} "${name}" was found after 5 seconds.`, {
    hint: `name the ${spec.noun} by the exact text of its label, ${spec.by.map((a) => `its ${a}`).join(', ')}, or by a CSS selector such as "#id" or "input[name=…]".`,
  });
}

/**
 * Check that a checkbox is (or is not) checked, or a radio button selected.
 *
 * @param {Object} world
 * @param {string} name
 * @param {'checkbox'|'radio'} kind
 * @param {boolean} wanted - true when it should be checked / selected.
 */
async function assertChoice(world, name, kind, wanted) {
  const spec = CONTROLS[kind];
  const loc = await locateControl(world.page, name, kind);
  let checked;
  try {
    checked = await loc.isChecked({ timeout: 5000 });
  } catch (e) {
    throw failure(world.page, `Could not read whether the ${spec.noun} "${name}" is ${spec.state}.`, {
      hint: `${humanize(e)}; the element the step found may not be a ${spec.noun}.`,
    });
  }
  if (checked === wanted) return;
  throw failure(world.page, wanted
    ? `The ${spec.noun} "${name}" is not ${spec.state}.`
    : `The ${spec.noun} "${name}" is ${spec.state}, but it should not be.`, {
    hint: `the ${spec.noun} is found by ${spec.says.replace(/ or the selector$/, '')} or a CSS selector; check that the step before it ${wanted ? spec.state.replace('ed', 's') : 'changes'} it.`,
  });
}

/**
 * Check or uncheck a checkbox, or select a radio button, found as the
 * assertions find it.
 *
 * @param {Object} world
 * @param {string} name
 * @param {'checkbox'|'radio'} kind
 * @param {'check'|'uncheck'} action
 */
async function setChoice(world, name, kind, action) {
  const spec = CONTROLS[kind];
  const loc = await locateControl(world.page, name, kind);
  try {
    await loc[action]({ timeout: 5000 });
  } catch (e) {
    throw failure(world.page, `Could not ${action === 'check' && kind === 'radio' ? 'select' : action} the ${spec.noun} "${name}".`, {
      hint: `${humanize(e)}; a ${spec.noun} that is hidden or disabled cannot be changed.`,
    });
  }
}

/**
 * Assert a field's current value is the empty string.
 *
 * Example #1: Then the field "username" should be empty
 * Example #2: Then the field "Email" should be empty
 * Example #3: And the field "#search" should be empty
 * Example #4: Then the field "[name=phone]" should be empty
 * Example #5: When I fill in "" for "Username"
 *               Then the field "username" should be empty
 *
 */
Then('the field {string} should be empty', async function (field) {
  const loc = await getField(this.page, field);
  const v = await loc.inputValue();
  assert.strictEqual(v, '', `Field "${field}" should be empty, got "${v}".`);
});

/**
 * Assert a field has a non-empty value.
 *
 * Example #1: Then the field "username" should not be empty
 * Example #2: Then the field "Email" should not be empty
 * Example #3: And the field "#search" should not be empty
 * Example #4: When I fill in "alice" for "Username"
 *               Then the field "username" should not be empty
 * Example #5: Then the field "[name=phone]" should not be empty
 *
 */
Then('the field {string} should not be empty', async function (field) {
  const loc = await getField(this.page, field);
  const v = await loc.inputValue();
  assert.notStrictEqual(v, '', `Field "${field}" should not be empty.`);
});

/**
 * Assert a field exists in the DOM (any state).
 *
 * Example #1: Then the field "username" should exist
 * Example #2: Then the field "Email" should exist
 * Example #3: And the field "#search" should exist
 * Example #4: Then the field "Password" should exist
 * Example #5: Then the field "[name=phone]" should exist
 *
 */
Then('the field {string} should exist', async function (field) {
  const loc = await getField(this.page, field);
  assert.ok(await loc.count() > 0, `Field "${field}" not found.`);
});

/**
 * Assert a field does NOT exist in the DOM.
 *
 * Example #1: Then the field "missing-field" should not exist
 * Example #2: Then the field "Legacy field" should not exist
 * Example #3: And the field "#deprecated" should not exist
 * Example #4: Then the field "Old name" should not exist
 * Example #5: Then the field "[name=internal_only]" should not exist
 *
 */
Then('the field {string} should not exist', async function (field) {
  const loc = await getField(this.page, field);
  assert.strictEqual(await loc.count(), 0, `Field "${field}" should not exist.`);
});

// The states `the field "X" should have "<state>" state` can check: how to
// read each one from the field, and how to name what the field is instead.
const FIELD_STATES = {
  enabled: async (loc) => !(await loc.isDisabled()),
  disabled: (loc) => loc.isDisabled(),
  editable: (loc) => loc.isEditable(),
  'read-only': async (loc) => !(await loc.isDisabled()) && !(await loc.isEditable()),
};
const FIELD_STATE_ALIASES = { readonly: 'read-only', 'read only': 'read-only' };

async function fieldStateNow(loc) {
  if (await loc.isDisabled()) return 'disabled';
  return (await loc.isEditable()) ? 'enabled and editable' : 'enabled and read-only';
}

/**
 * Assert a field's state: `enabled`, `disabled`, `editable` (enabled and not
 * read-only) or `read-only` (enabled, but its value cannot be changed;
 * `readonly` works too). Any other word fails the step with the list of the
 * states it can check.
 *
 * Example #1: Then the field "username" should have "enabled" state
 * Example #2: Then the field "Email" should have "disabled" state
 * Example #3: And the field "#search" should have "enabled" state
 * Example #4: Then the field "Password" should have "disabled" state
 * Example #5: Then the field "Country" should have "enabled" state
 * Example #6: Then the field "Reference" should have "read-only" state
 * Example #7: Then the field "Display name" should have "editable" state
 *
 */
Then('the field {string} should have {string} state', async function (field, state) {
  const wanted = String(state).trim().toLowerCase();
  const name = FIELD_STATE_ALIASES[wanted] || wanted;
  const check = FIELD_STATES[name];
  if (!check) {
    throw failure(this.page, `"${state}" is not a state this step can check.`, {
      hint: `use one of: ${Object.keys(FIELD_STATES).join(', ')}. For the other states use their own steps: the field "${field}" should be required, the "${field}" checkbox should be checked, "${field}" should be visible.`,
    });
  }
  const loc = await getField(this.page, field);
  try {
    await loc.waitFor({ state: 'attached', timeout: 5000 });
  } catch (e) {
    throw failure(this.page, `The field "${field}" was not found on the page after 5 seconds.`, {
      hint: `"${field}" is read as the text of a label, else as a name or an id, else as a CSS selector that starts with #, . or [.`,
    });
  }
  if (!(await check(loc))) {
    throw failure(this.page, `The field "${field}" is not ${name}.`, {
      found: `it is ${await fieldStateNow(loc)}`,
      hint: 'a disabled field is neither editable nor read-only; a read-only field is enabled but its value cannot be changed.',
    });
  }
});

/**
 * Assert a field has the `required` or `aria-required="true"` attribute.
 *
 * Example #1: Then the field "username" should be required
 * Example #2: Then the field "Email" should be required
 * Example #3: And the field "Password" should be required
 * Example #4: Then the field "Country" should be required
 * Example #5: Then the field "Card number" should be required
 *
 */
Then('the field {string} should be required', async function (field) {
  const loc = await getField(this.page, field);
  const req = await loc.getAttribute('required');
  const aria = await loc.getAttribute('aria-required');
  assert.ok(req !== null || aria === 'true', `Field "${field}" should be required.`);
});

/**
 * Assert a field is NOT required.
 *
 * Example #1: Then the field "bio" should not be required
 * Example #2: Then the field "Nickname" should not be required
 * Example #3: And the field "Phone" should not be required
 * Example #4: Then the field "Comments" should not be required
 * Example #5: Then the field "Twitter handle" should not be required
 *
 */
Then('the field {string} should not be required', async function (field) {
  const loc = await getField(this.page, field);
  const req = await loc.getAttribute('required');
  const aria = await loc.getAttribute('aria-required');
  assert.ok(req === null && aria !== 'true', `Field "${field}" should not be required.`);
});

// Find, in the page, the inputs of the multi-value field named `field`, in
// the order of the page, and return a CSS path to each (an empty list when
// there are none yet). In this order, the first that has inputs wins:
//   1. inputs whose name is `field[]`, `field[0]`, `field[0][value]`…;
//   2. the inputs of a <fieldset> whose <legend> is the text;
//   3. the inputs that follow a <label> whose text is the text: from the
//      control it is for (else from the label) up to the next label, legend
//      or fieldset of the same level, in the container they share.
// Text compared with letter case and white space aside. Text-like inputs and
// textareas only: a hidden input, a checkbox or a weight select is no value.
function findMultiValueInputs(field) {
  const VALUE = 'input:not([type]), input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"], input[type="search"], input[type="date"], input[type="time"], input[type="datetime-local"], textarea';
  const norm = (text) => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const wanted = norm(field);
  const follows = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const BOUNDARY = 'label, legend, fieldset';

  function pathTo(el) {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && node !== document.documentElement; node = node.parentElement) {
      let index = 1;
      for (let sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
        if (sib.tagName === node.tagName) index += 1;
      }
      parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${index})`);
    }
    return 'html > ' + parts.join(' > ');
  }

  const byName = Array.from(document.querySelectorAll(VALUE)).filter((el) => {
    const name = el.getAttribute('name') || '';
    return name === `${field}[]` || name.startsWith(`${field}[`);
  });
  if (byName.length) return byName.map(pathTo);

  for (const legend of document.querySelectorAll('fieldset > legend')) {
    if (norm(legend.textContent) !== wanted) continue;
    const inputs = Array.from(legend.parentElement.querySelectorAll(VALUE));
    if (inputs.length) return inputs.map(pathTo);
  }

  for (const lab of document.querySelectorAll('label')) {
    if (norm(lab.textContent) !== wanted) continue;
    const start = lab.control && lab.control.matches(VALUE) ? lab.control : lab;
    let box = start.parentElement;
    while (box && !box.contains(lab)) box = box.parentElement;
    if (!box) continue;
    const inputs = [];
    if (start !== lab) inputs.push(start);
    for (const el of box.querySelectorAll(`${VALUE}, ${BOUNDARY}`)) {
      if (el === start || el === lab || lab.contains(el) || !follows(start, el)) continue;
      if (el.matches(BOUNDARY)) {
        if (el.parentElement && el.parentElement.contains(lab)) break;
        continue;
      }
      inputs.push(el);
    }
    if (inputs.length) return inputs.map(pathTo);
  }
  return [];
}

/**
 * Fill a multi-value form field from a table, one value per input, in the
 * order of the page.
 *
 * The field is named by the name of its inputs (`tags` for `tags[]`,
 * `tags[0]` or `tags[0][value]`), by the legend of its fieldset, or by its
 * label (the inputs from the one the label is for up to the next field).
 * A field that is not found within 5 seconds, or that has fewer inputs than
 * values, fails the step before anything is filled.
 *
 * Example #1: When I fill in the multi-value field "tags" with the following values:
 *               | bdd     |
 *               | testing |
 * Example #2: When I fill in the multi-value field "skills" with the following values:
 *               | js  |
 *               | css |
 *               | sql |
 * Example #3: And we fill in the multi-value field "phones" with the following values:
 *               | 0790000000 |
 *               | 0791111111 |
 * Example #4: When I fill in the multi-value field "ids" with the following values:
 *               | 1 |
 *               | 2 |
 * Example #5: When I fill in the multi-value field "categories" with the following values:
 *               | tech    |
 *               | devops  |
 *               | testing |
 * Example #6: When I fill in the multi-value field "Phone numbers" with the following values:
 *               | 0790000000 |
 *               | 0791111111 |
 *
 */
When(/^(I |we )*fill in the multi-value field "([^"]*)" with the following values:$/, async function (pronoun, field, table) {
  const values = table.raw().flat();
  const deadline = Date.now() + 5000;
  let paths = [];
  for (;;) {
    paths = await this.page.evaluate(findMultiValueInputs, field).catch(() => []);
    if (paths.length || Date.now() >= deadline) break;
    await this.page.waitForTimeout(100);
  }
  if (!paths.length) {
    throw failure(this.page, `No multi-value field "${field}" was found after 5 seconds.`, {
      hint: `name the field by the name of its inputs ("${field}" for ${field}[] or ${field}[0]), by the legend of its fieldset, or by the exact text of its label.`,
    });
  }
  if (paths.length < values.length) {
    throw failure(this.page, `The multi-value field "${field}" has ${paths.length} input${paths.length === 1 ? '' : 's'} for ${values.length} values.`, {
      hint: 'add inputs first (a form often has an "Add another item" button), or give as many values as the field has inputs.',
    });
  }
  for (let i = 0; i < values.length; i++) {
    await fillLocator(this.page, this.page.locator(paths[i]), values[i], `${field} (value ${i + 1})`);
  }
});

/**
 * Fill an `<input type="color">` field with a hex value.
 *
 * Example #1: When I fill in the color field "favorite" with the value "#ff0000"
 * Example #2: When I fill in the color field "primary" with the value "#0066cc"
 * Example #3: And we fill in the color field "Accent" with the value "#00aa66"
 * Example #4: When I fill in the color field "#bg-color" with the value "#000000"
 * Example #5: When I fill in the color field "Theme" with the value "#ffaa00"
 *
 */
When(/^(I |we )*fill in the color field "([^"]*)" with the value "([^"]*)"$/, async function (pronoun, field, value) {
  const loc = await getField(this.page, field);
  await loc.fill(value);
});

/**
 * Assert an `<input type="color">` field's current value (case-insensitive).
 *
 * Example #1: Then the color field "favorite" should have the value "#ff0000"
 * Example #2: Then the color field "primary" should have the value "#0066cc"
 * Example #3: And the color field "Accent" should have the value "#00aa66"
 * Example #4: Then the color field "#bg-color" should have the value "#000000"
 * Example #5: Then the color field "Theme" should have the value "#ffaa00"
 *
 */
Then('the color field {string} should have the value {string}', async function (field, value) {
  const loc = await getField(this.page, field);
  assert.strictEqual((await loc.inputValue()).toLowerCase(), value.toLowerCase());
});

/**
 * Fill a CKEditor / contenteditable rich-text field with HTML.
 *
 * The field is found by the name or the id of its form control, by the text
 * of its label, or by the accessible name of its editable area
 * (`aria-label` / `aria-labelledby`). The editable area that is filled is the
 * one that belongs to that field, so a page with several editors is filled in
 * the right place. A page with a single editor is filled whatever the name.
 *
 * Example #1: When I fill in the WYSIWYG field "body" with the "Hello world"
 * Example #2: When I fill in the WYSIWYG field "Description" with the "<strong>Bold</strong>"
 * Example #3: And we fill in the WYSIWYG field "content" with the "Plain paragraph"
 * Example #4: When I fill in the WYSIWYG field "post" with the "Multi line\ntext"
 * Example #5: When I fill in the WYSIWYG field "Notes" with the "Final notes here"
 *
 */
When(/^(I |we )*fill in the WYSIWYG field "([^"]*)" with the "([^"]*)"$/, async function (pronoun, field, value) {
  const filled = await this.page.evaluate(({ field, value }) => {
    const EDITABLE = '.ck-editor__editable, [contenteditable="true"], [contenteditable=""]';
    const html = `<p>${value}</p>`;
    const byId = (id) => (id ? document.getElementById(id) : null);
    const sameText = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim() === field;

    // 1. What the name points at: a form control by its name or id, a label
    //    by its text, or an editable area by its accessible name.
    let source = Array.from(document.getElementsByName(field))[0] || byId(field);
    if (!source) {
      const label = Array.from(document.querySelectorAll('label')).find(sameText);
      if (label) source = label.control || byId(label.getAttribute('for'));
    }
    if (!source) {
      source = Array.from(document.querySelectorAll(EDITABLE)).find((el) => {
        if (el.getAttribute('aria-label') === field) return true;
        const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
        return ids.some((id) => { const named = byId(id); return named && sameText(named); });
      }) || null;
    }

    // 2. The editable area that belongs to it. An editor renders right after
    //    the form control it replaces; failing that, it is the only editable
    //    area of the closest wrapper around the control.
    let editable = null;
    if (source && source.matches(EDITABLE)) {
      editable = source;
    } else if (source) {
      for (let el = source.nextElementSibling; el && !editable; el = el.nextElementSibling) {
        if (el.matches('label, input, textarea, select')) break;
        editable = el.matches(EDITABLE) ? el : el.querySelector(EDITABLE);
      }
      for (let box = source.parentElement; box && box !== document.body && !editable; box = box.parentElement) {
        const inside = box.querySelectorAll(EDITABLE);
        if (inside.length === 1) editable = inside[0];
        if (inside.length > 1) break;
      }
    } else {
      const all = document.querySelectorAll(EDITABLE);
      if (all.length === 1) editable = all[0];
    }

    const control = source && source !== editable && 'value' in source ? source : null;
    if (control) {
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (editable) {
      const ck5 = editable.ckeditorInstance;
      if (ck5 && typeof ck5.setData === 'function') ck5.setData(html);
      else {
        editable.innerHTML = html;
        editable.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    // CKEditor 4 edits inside an iframe and keeps its instances by control id or name.
    const registry = window.CKEDITOR && window.CKEDITOR.instances;
    const ck4 = registry && control ? (registry[control.id] || registry[control.name]) : null;
    if (ck4 && typeof ck4.setData === 'function') ck4.setData(html);

    return Boolean(control || editable || ck4);
  }, { field, value });
  if (!filled) {
    throw friendly({
      action: 'fill in the WYSIWYG field',
      target: field,
      cause: 'no form control with that name or id, no label with that text and no editable area with that accessible name was found',
      hint: 'use the name or the id of the textarea behind the editor, the text of its label, or the aria-label of the editable area.',
    });
  }
});

/**
 * Assert a `<select>` contains an option with the given visible text.
 *
 * Example #1: Then the option "Mercedes" should exist within the select element "#cars"
 * Example #2: Then the option "Editor" should exist within the select element "select[name=role]"
 * Example #3: And the option "English" should exist within the select element "#language"
 * Example #4: Then the option "Premium" should exist within the select element "#plan"
 * Example #5: Then the option "Jordan" should exist within the select element "#country"
 *
 */
Then('the option {string} should exist within the select element {string}', async function (option, sel) {
  const count = await this.page.locator(`${sel} option:has-text("${option}")`).count();
  assert.ok(count > 0, `Option "${option}" not found in "${sel}".`);
});

/**
 * Assert a `<select>` does NOT contain an option with the given text.
 *
 * Example #1: Then the option "Manager" should not exist within the select element "#role"
 * Example #2: Then the option "Trial" should not exist within the select element "#plan"
 * Example #3: And the option "Old country" should not exist within the select element "#country"
 * Example #4: Then the option "Hidden" should not exist within the select element "#status"
 * Example #5: Then the option "Legacy" should not exist within the select element "#mode"
 *
 */
Then('the option {string} should not exist within the select element {string}', async function (option, sel) {
  const count = await this.page.locator(`${sel} option:has-text("${option}")`).count();
  assert.strictEqual(count, 0, `Option "${option}" should not exist in "${sel}".`);
});

/**
 * Assert an option is currently selected in a `<select>`.
 *
 * Example #1: Then the option "Mercedes" should be selected within the select element "#cars"
 * Example #2: Then the option "Editor" should be selected within the select element "#role"
 * Example #3: And the option "English" should be selected within the select element "#language"
 * Example #4: Then the option "Premium" should be selected within the select element "#plan"
 * Example #5: Then the option "Jordan" should be selected within the select element "#country"
 *
 */
Then('the option {string} should be selected within the select element {string}', async function (option, sel) {
  const selected = await this.page.locator(sel).first().evaluate((el) => Array.from(el.selectedOptions || []).map((o) => o.text));
  assert.ok(selected.includes(option), `Option "${option}" not selected in "${sel}".`);
});

/**
 * Assert an option is NOT currently selected in a `<select>`.
 *
 * Example #1: Then the option "Admin" should not be selected within the select element "#role"
 * Example #2: Then the option "Pro" should not be selected within the select element "#plan"
 * Example #3: And the option "Other" should not be selected within the select element "#country"
 * Example #4: Then the option "Inactive" should not be selected within the select element "#status"
 * Example #5: Then the option "Trial" should not be selected within the select element "#mode"
 *
 */
Then('the option {string} should not be selected within the select element {string}', async function (option, sel) {
  const selected = await this.page.locator(sel).first().evaluate((el) => Array.from(el.selectedOptions || []).map((o) => o.text));
  assert.ok(!selected.includes(option), `Option "${option}" should not be selected in "${sel}".`);
});

/**
 * Unselect a single option from a `<select multiple>`.
 *
 * Example #1: When I unselect "Red" from "#colors"
 * Example #2: When I unselect "Editor" from "#role"
 * Example #3: And we unselect "tag-a" from "select[name=tags]"
 * Example #4: When I unselect "EN" from "#languages"
 * Example #5: When I unselect "Beta" from "#features"
 *
 */
When(/^(I |we )*unselect "([^"]*)" from "([^"]*)"$/, async function (pronoun, option, sel) {
  await this.page.locator(sel).first().evaluate((el, opt) => {
    Array.from(el.options).forEach((o) => { if (o.text === opt || o.value === opt) o.selected = false; });
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, option);
});

/**
 * Clear all selections in a `<select multiple>`.
 *
 * Example #1: When I clear the select "#colors"
 * Example #2: When I clear the select "#tags"
 * Example #3: And I clear the select "select[name=roles]"
 * Example #4: When I clear the select "#languages"
 * Example #5: When I clear the select "#features"
 *
 */
When(/^(I |we )*clear the select "([^"]*)"$/, async function (pronoun, sel) {
  await this.page.locator(sel).first().evaluate((el) => {
    Array.from(el.options).forEach((o) => (o.selected = false));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

/**
 * Check a checkbox.
 *
 * The checkbox is named by a CSS selector, the exact text of its label, its
 * name, its id or its value; one that is not found within 5 seconds fails
 * the step plainly.
 *
 * Example #1: When I check the checkbox "#agree"
 * Example #2: When I check the checkbox "input[name=newsletter]"
 * Example #3: And we check the checkbox ".terms"
 * Example #4: When I check the checkbox "#remember-me"
 * Example #5: When I check the checkbox "[data-testid=privacy-checkbox]"
 *
 */
When(/^(I |we )*check the checkbox "([^"]*)"$/, async function (pronoun, sel) {
  await setChoice(this, sel, 'checkbox', 'check');
});

/**
 * Uncheck a checkbox.
 *
 * The checkbox is named by a CSS selector, the exact text of its label, its
 * name, its id or its value; one that is not found within 5 seconds fails
 * the step plainly.
 *
 * Example #1: When I uncheck the checkbox "#newsletter"
 * Example #2: When I uncheck the checkbox "input[name=marketing]"
 * Example #3: And we uncheck the checkbox ".analytics-opt-in"
 * Example #4: When I uncheck the checkbox "#remember-me"
 * Example #5: When I uncheck the checkbox "[data-testid=privacy-checkbox]"
 *
 */
When(/^(I |we )*uncheck the checkbox "([^"]*)"$/, async function (pronoun, sel) {
  await setChoice(this, sel, 'checkbox', 'uncheck');
});

/**
 * Select a radio button.
 *
 * The radio button is named by a CSS selector, the exact text of its label,
 * its id or its value (not its name, which its whole group shares); one that
 * is not found within 5 seconds fails the step plainly.
 *
 * Example #1: When I choose the radio button "#gender-male"
 * Example #2: When I choose the radio button "input[value=premium]"
 * Example #3: And we choose the radio button ".plan-monthly"
 * Example #4: When I choose the radio button "#yes"
 * Example #5: When I choose the radio button "[data-testid=annual]"
 *
 */
When(/^(I |we )*choose the radio button "([^"]*)"$/, async function (pronoun, sel) {
  await setChoice(this, sel, 'radio', 'check');
});

// Note: "the radio button :sel should be selected" is already provided by
// webship.js core via a regex with the same phrasing. Skipped to avoid
// ambiguous step matches.

/**
 * Fill an input or a textarea with a value. The field is named by a CSS
 * selector, the exact text of its label, its name or its id; one that is not
 * found within 5 seconds, or that is hidden, disabled or read-only, fails the
 * step plainly.
 *
 * Example #1: When I fill in the field "#username" with "alice"
 * Example #2: When I fill in the field "input[name=email]" with "alice@example.com"
 * Example #3: And we fill in the field "#search" with "laptops"
 * Example #4: When I fill in the field "[data-testid=phone]" with "0790000000"
 * Example #5: When I fill in the field "textarea#message" with "Hello"
 *
 */
When(/^(I |we )*fill in the field "([^"]*)" with "([^"]*)"$/, async function (pronoun, sel, value) {
  const loc = await locateControl(this.page, sel, 'field');
  await fillLocator(this.page, loc, value, sel);
});

/**
 * Disable native browser validation on a form (sets `novalidate`).
 *
 * Useful when a test needs to submit an intentionally invalid form to
 * exercise server-side error rendering.
 *
 * Example #1: Given browser validation for the form "#signup" is disabled
 * Example #2: Given browser validation for the form "form[name=login]" is disabled
 * Example #3: And browser validation for the form ".checkout-form" is disabled
 * Example #4: Given browser validation for the form "#contact" is disabled
 * Example #5: Given browser validation for the form "[data-testid=newsletter]" is disabled
 *
 */
Given('browser validation for the form {string} is disabled', async function (sel) {
  await this.page.evaluate((s) => {
    const f = document.querySelector(s);
    if (f) f.setAttribute('novalidate', 'novalidate');
  }, sel);
});

/**
 * Fill paired `<input type=date>` + `<input type=time>` controls for a label.
 *
 * The field is named by the exact text of its label or of the legend of its
 * fieldset (white space and letter case aside), and only its own inputs are
 * filled: the one inside the label, the one the label is for, or the ones
 * that follow the label before the next field. An input whose name or
 * aria-label contains that text is found too. When an input is not found
 * within 5 seconds the step fails and fills nothing.
 *
 * Example #1: When I fill in the datetime field "Start" with date "2026-05-08" and time "10:00"
 * Example #2: When I fill in the datetime field "Departure" with date "2026-12-31" and time "23:59"
 * Example #3: And we fill in the datetime field "Pickup" with date "2026-07-04" and time "08:30"
 * Example #4: When I fill in the datetime field "Booking" with date "2026-01-01" and time "00:00"
 * Example #5: When I fill in the datetime field "Reminder" with date "2026-09-15" and time "14:00"
 *
 */
When(/^(I |we )*fill in the datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$/, async function (pronoun, label, date, time) {
  // Both inputs are found before either is filled: a failure leaves the form as it was.
  const dateInput = await datetimePart(this.page, label, 'date');
  const timeInput = await datetimePart(this.page, label, 'time');
  await dateInput.fill(date);
  await timeInput.fill(time);
});

/**
 * Fill only the date component of a paired datetime field.
 *
 * Example #1: When I fill in the date part of the datetime field "Start" with "2026-05-08"
 * Example #2: When I fill in the date part of the datetime field "Birth date" with "1990-01-15"
 * Example #3: And we fill in the date part of the datetime field "Booking" with "2026-12-31"
 * Example #4: When I fill in the date part of the datetime field "Pickup" with "2026-07-04"
 * Example #5: When I fill in the date part of the datetime field "Reminder" with "2026-09-15"
 *
 */
When(/^(I |we )*fill in the date part of the datetime field "([^"]*)" with "([^"]*)"$/, async function (pronoun, label, date) {
  await (await datetimePart(this.page, label, 'date')).fill(date);
});

/**
 * Fill only the time component of a paired datetime field.
 *
 * Example #1: When I fill in the time part of the datetime field "Start" with "10:00"
 * Example #2: When I fill in the time part of the datetime field "Pickup" with "08:30"
 * Example #3: And we fill in the time part of the datetime field "Booking" with "23:59"
 * Example #4: When I fill in the time part of the datetime field "Reminder" with "14:00"
 * Example #5: When I fill in the time part of the datetime field "Departure" with "06:15"
 *
 */
When(/^(I |we )*fill in the time part of the datetime field "([^"]*)" with "([^"]*)"$/, async function (pronoun, label, time) {
  await (await datetimePart(this.page, label, 'time')).fill(time);
});

/**
 * Fill the `start` half of a date-range pair.
 *
 * The range is named by the exact text of its label or of the legend of its
 * fieldset; of its inputs, the ones whose name, id or aria-label contains
 * "start" are filled.
 *
 * Example #1: When I fill in the start datetime field "Event" with date "2026-05-08" and time "10:00"
 * Example #2: When I fill in the start datetime field "Trip" with date "2026-12-31" and time "08:00"
 * Example #3: And we fill in the start datetime field "Window" with date "2026-07-04" and time "12:00"
 * Example #4: When I fill in the start datetime field "Promo" with date "2026-01-01" and time "00:00"
 * Example #5: When I fill in the start datetime field "Booking" with date "2026-09-15" and time "14:00"
 *
 */
When(/^(I |we )*fill in the start datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$/, async function (pronoun, label, date, time) {
  const dateInput = await datetimePart(this.page, label, 'date', 'start');
  const timeInput = await datetimePart(this.page, label, 'time', 'start');
  await dateInput.fill(date);
  await timeInput.fill(time);
});

/**
 * Fill the `end` half of a date-range pair.
 *
 * The range is named by the exact text of its label or of the legend of its
 * fieldset; of its inputs, the ones whose name, id or aria-label contains
 * "end" are filled.
 *
 * Example #1: When I fill in the end datetime field "Event" with date "2026-05-09" and time "18:00"
 * Example #2: When I fill in the end datetime field "Trip" with date "2027-01-07" and time "20:00"
 * Example #3: And we fill in the end datetime field "Window" with date "2026-07-04" and time "18:00"
 * Example #4: When I fill in the end datetime field "Promo" with date "2026-01-31" and time "23:59"
 * Example #5: When I fill in the end datetime field "Booking" with date "2026-09-15" and time "16:00"
 *
 */
When(/^(I |we )*fill in the end datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$/, async function (pronoun, label, date, time) {
  const dateInput = await datetimePart(this.page, label, 'date', 'end');
  const timeInput = await datetimePart(this.page, label, 'time', 'end');
  await dateInput.fill(date);
  await timeInput.fill(time);
});

// ---------------------------------------------------------------------------
// Field text content + checkbox / radio state assertions
// (relocated from webship.js; field-related assertions live in this file).
// ---------------------------------------------------------------------------

const { Then: ThenF } = require('@cucumber/cucumber');
const assertF = require('assert');
const { getLocatorText: getLocatorTextF, locateByLabelOrSelector: locateByLabelOrSelectorF, friendly: friendlyF } = require('./webship');

/**
 * Assert that a form field contains or does not contain specific text.
 *
 * The field is named by the exact text of its label, or by a CSS selector.
 *
 * Example #1: Then the "Username" field should contain "John Smith"
 * Example #2: Then the "#username" field should not contain "John Smith"
 * Example #3: And the "Email" field should contain "jon@example.com"
 * Example #4: Then the "[name=username]" field should contain "John Smith"
 * Example #5: And the "input.email" field should not contain "example.org"
 *
 */
ThenF(/^(the )*"([^"]*)?" field should( not)* contain "([^"]*)?"$/, async function (theCase, field, notCase, expectedText) {
  const loc = await locateByLabelOrSelectorF(this.page, field, 5000);
  if (!loc) {
    throw friendlyF({
      message: `The field "${field}" was not found on the page after 5 seconds.`,
      hint: `"${field}" is read as the exact text of a label, else as a CSS selector such as "#username" or "[name=username]".`,
    });
  }
  const content = await getLocatorTextF(loc);
  if (notCase) {
    assertF.ok(!content.includes(expectedText), `Field should NOT contain "${expectedText}" but it does.`);
  } else {
    assertF.ok(content.includes(expectedText), `Field should contain "${expectedText}" but it does not.`);
  }
});

/**
 * Assert that a checkbox should or should not be checked.
 *
 * The checkbox is named by a CSS selector, the exact text of its label, its
 * name, its id or its value; one that is not found within 5 seconds fails
 * the step plainly.
 *
 * Example #1: Then the "#privacy-policy" checkbox should be checked
 * Example #2: Then the "#newsletter" checkbox should not be checked
 * Example #3: And the "#agree" checkbox should be checked
 * Example #4: Then the ".terms" checkbox should not be checked
 * Example #5: When I check "Remember me"
 *               Then the "#remember" checkbox should be checked
 *
 */
ThenF(/^(the )*"([^"]*)?" checkbox should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  await assertChoice(this, checkbox, 'checkbox', !notCase);
});

/**
 * Assert that a checkbox is or is not checked.
 *
 * The checkbox is named by a CSS selector, the exact text of its label, its
 * name, its id or its value; one that is not found within 5 seconds fails
 * the step plainly.
 *
 * Alternate phrasing of "should be / should not be checked".
 *
 * Example #1: Then the "#remember-me" checkbox is checked
 * Example #2: Then the "#newsletter" checkbox is not checked
 * Example #3: And the "#agree" checkbox is checked
 * Example #4: Then the ".terms" checkbox is not checked
 * Example #5: When I check "Subscribe"
 *               Then the "#subscribe" checkbox is checked
 *
 */
ThenF(/^(the )*"([^"]*)?" checkbox is( not)* checked$/, async function (theCase, checkbox, notCase) {
  await assertChoice(this, checkbox, 'checkbox', !notCase);
});

/**
 * Assert that a named checkbox should or should not be checked.
 *
 * The checkbox is named by a CSS selector, the exact text of its label, its
 * name, its id or its value; one that is not found within 5 seconds fails
 * the step plainly.
 *
 * Reverse phrasing — "checkbox <selector>" instead of "<selector> checkbox".
 *
 * Example #1: Then the checkbox "#privacy-policy" should be checked
 * Example #2: Then the checkbox "#newsletter" should not be checked
 * Example #3: And the checkbox "#agree" should be checked
 * Example #4: Then the checkbox ".terms" should not be checked
 * Example #5: When I check "Subscribe"
 *               Then the checkbox "#subscribe" should be checked
 *
 */
ThenF(/^(the )*checkbox "([^"]*)?" should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  await assertChoice(this, checkbox, 'checkbox', !notCase);
});

/**
 * Assert that a named checkbox is or is not checked.
 *
 * The checkbox is named by a CSS selector, the exact text of its label, its
 * name, its id or its value; one that is not found within 5 seconds fails
 * the step plainly.
 *
 * Reverse phrasing using "is / is not".
 *
 * Example #1: Then the checkbox "#remember-me" is checked
 * Example #2: Then the checkbox "#newsletter" is not checked
 * Example #3: And the checkbox "#agree" is checked
 * Example #4: Then the checkbox ".terms" is not checked
 * Example #5: When I check "Subscribe"
 *               Then the checkbox "#subscribe" is checked
 *
 */
ThenF(/^(the )*checkbox "([^"]*)?" is( not)* checked$/, async function (theCase, checkbox, notCase) {
  await assertChoice(this, checkbox, 'checkbox', !notCase);
});

/**
 * Assert that a radio button should or should not be selected.
 *
 * The radio button is named by a CSS selector, the exact text of its label,
 * its id or its value (not its name, which its whole group shares); one that
 * is not found within 5 seconds fails the step plainly.
 *
 * Example #1: Then the radio button "#gender-male" should be selected
 * Example #2: Then the radio button "#gender-female" should not be selected
 * Example #3: Then the radio button ".option-1" should be selected
 *
 */
ThenF(/^(the )*radio button "([^"]*)?" should( not)* be selected$/, async function (theCase, radioButton, notCase) {
  await assertChoice(this, radioButton, 'radio', !notCase);
});

/**
 * Assert that a radio button with a given value should or should not be selected.
 *
 * Looks up the radio by `[value="..."]`.
 *
 * Example #1: Then the radio button with value "male" should be selected
 * Example #2: Then the radio button with value "female" should not be selected
 * Example #3: And the radio button with value "premium" should be selected
 * Example #4: Then the radio button with value "monthly" should not be selected
 * Example #5: When I select radio button "Premium"
 *               Then the radio button with value "premium" should be selected
 *
 */
ThenF(/^(the )*radio button with value "([^"]*)?" should( not)* be selected$/, async function (theCase, radioValue, notCase) {
  const loc = this.page.locator(`input[type="radio"][value="${String(radioValue).replace(/["\\]/g, '\\$&')}"]`).first();
  try {
    await loc.waitFor({ state: 'attached', timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, `No radio button with the value "${radioValue}" was found after 5 seconds.`, {
      hint: 'the step reads the value attribute of the radio buttons, not their label; to name one by its label, use: the radio button "<label>" should be selected',
    });
  }
  const isChecked = await loc.isChecked();
  if (isChecked !== !notCase) {
    throw failure(this.page, notCase
      ? `The radio button with the value "${radioValue}" is selected, but it should not be.`
      : `The radio button with the value "${radioValue}" is not selected.`, {
      hint: 'check that the step before it selects the radio button you expect.',
    });
  }
});

/**
 * Assert that the radio button is or is not selected.
 *
 * The radio button is named by a CSS selector, the exact text of its label,
 * its id or its value (not its name, which its whole group shares); one that
 * is not found within 5 seconds fails the step plainly.
 *
 * Alternate phrasing using "is / is not selected".
 *
 * Example #1: Then the "#gender-male" radio button is selected
 * Example #2: Then the "#gender-female" radio button is not selected
 * Example #3: And the "#plan-premium" radio button is selected
 * Example #4: Then the ".option-1" radio button is not selected
 * Example #5: When I select radio button "Female"
 *               Then the "#gender-female" radio button is selected
 *
 */
ThenF(/^(the )*"([^"]*)?" radio button is( not)* selected$/, async function (theCase, radioButton, notCase) {
  await assertChoice(this, radioButton, 'radio', !notCase);
});
