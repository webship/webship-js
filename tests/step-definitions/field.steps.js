'use strict';

// Form field assertions and interactions.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

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

/**
 * Assert a field's enabled / disabled state.
 *
 * Example #1: Then the field "username" should have "enabled" state
 * Example #2: Then the field "Email" should have "disabled" state
 * Example #3: And the field "#search" should have "enabled" state
 * Example #4: Then the field "Password" should have "disabled" state
 * Example #5: Then the field "Country" should have "enabled" state
 *
 */
Then('the field {string} should have {string} state', async function (field, state) {
  const loc = await getField(this.page, field);
  const disabled = await loc.isDisabled();
  if (state === 'disabled') assert.ok(disabled, `Field "${field}" should be disabled.`);
  else assert.ok(!disabled, `Field "${field}" should be enabled.`);
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

/**
 * Fill a multi-value form field (e.g. `name[]` array inputs) from a table.
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
 *
 */
When(/^(I |we )*fill in the multi-value field "([^"]*)" with the following values:$/, async function (pronoun, field, table) {
  const values = table.raw().flat();
  for (let i = 0; i < values.length; i++) {
    const inputs = this.page.locator(`[name="${field}[${i}]"], [name="${field}[]"]`);
    const count = await inputs.count();
    const target = count > i ? inputs.nth(i) : inputs.first();
    await target.fill(values[i]);
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
 * Example #1: When I fill in the WYSIWYG field "body" with the "Hello world"
 * Example #2: When I fill in the WYSIWYG field "Description" with the "<strong>Bold</strong>"
 * Example #3: And we fill in the WYSIWYG field "content" with the "Plain paragraph"
 * Example #4: When I fill in the WYSIWYG field "post" with the "Multi line\ntext"
 * Example #5: When I fill in the WYSIWYG field "Notes" with the "Final notes here"
 *
 */
When(/^(I |we )*fill in the WYSIWYG field "([^"]*)" with the "([^"]*)"$/, async function (pronoun, field, value) {
  // CKEditor5/4 fallback: try contenteditable.
  await this.page.evaluate(({ field, value }) => {
    const editor = document.querySelector(`[name="${field}"], #${field}`);
    if (editor && 'value' in editor) editor.value = value;
    const ce = document.querySelector('.ck-editor__editable, [contenteditable="true"]');
    if (ce) ce.innerHTML = `<p>${value}</p>`;
  }, { field, value });
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
 * Check a CSS-addressed checkbox.
 *
 * Example #1: When I check the checkbox "#agree"
 * Example #2: When I check the checkbox "input[name=newsletter]"
 * Example #3: And we check the checkbox ".terms"
 * Example #4: When I check the checkbox "#remember-me"
 * Example #5: When I check the checkbox "[data-testid=privacy-checkbox]"
 *
 */
When(/^(I |we )*check the checkbox "([^"]*)"$/, async function (pronoun, sel) {
  await this.page.locator(sel).first().check();
});

/**
 * Uncheck a CSS-addressed checkbox.
 *
 * Example #1: When I uncheck the checkbox "#newsletter"
 * Example #2: When I uncheck the checkbox "input[name=marketing]"
 * Example #3: And we uncheck the checkbox ".analytics-opt-in"
 * Example #4: When I uncheck the checkbox "#remember-me"
 * Example #5: When I uncheck the checkbox "[data-testid=privacy-checkbox]"
 *
 */
When(/^(I |we )*uncheck the checkbox "([^"]*)"$/, async function (pronoun, sel) {
  await this.page.locator(sel).first().uncheck();
});

/**
 * Select a CSS-addressed radio button.
 *
 * Example #1: When I choose the radio button "#gender-male"
 * Example #2: When I choose the radio button "input[value=premium]"
 * Example #3: And we choose the radio button ".plan-monthly"
 * Example #4: When I choose the radio button "#yes"
 * Example #5: When I choose the radio button "[data-testid=annual]"
 *
 */
When(/^(I |we )*choose the radio button "([^"]*)"$/, async function (pronoun, sel) {
  await this.page.locator(sel).first().check();
});

// Note: "the radio button :sel should be selected" is already provided by
// webship.js core via a regex with the same phrasing. Skipped to avoid
// ambiguous step matches.

/**
 * Fill a CSS-addressed input/textarea with a value.
 *
 * Example #1: When I fill in the field "#username" with "alice"
 * Example #2: When I fill in the field "input[name=email]" with "alice@example.com"
 * Example #3: And we fill in the field "#search" with "laptops"
 * Example #4: When I fill in the field "[data-testid=phone]" with "0790000000"
 * Example #5: When I fill in the field "textarea#message" with "Hello"
 *
 */
When(/^(I |we )*fill in the field "([^"]*)" with "([^"]*)"$/, async function (pronoun, sel, value) {
  await this.page.locator(sel).first().fill(value);
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
 * Example #1: When I fill in the datetime field "Start" with date "2026-05-08" and time "10:00"
 * Example #2: When I fill in the datetime field "Departure" with date "2026-12-31" and time "23:59"
 * Example #3: And we fill in the datetime field "Pickup" with date "2026-07-04" and time "08:30"
 * Example #4: When I fill in the datetime field "Booking" with date "2026-01-01" and time "00:00"
 * Example #5: When I fill in the datetime field "Reminder" with date "2026-09-15" and time "14:00"
 *
 */
When(/^(I |we )*fill in the datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$/, async function (pronoun, label, date, time) {
  const root = this.page.locator(`label:has-text("${label}")`).first();
  await this.page.locator(`input[type="date"][name*="${label}"], label:has-text("${label}") ~ * input[type="date"]`).first().fill(date).catch(() => {});
  await this.page.locator(`input[type="time"][name*="${label}"], label:has-text("${label}") ~ * input[type="time"]`).first().fill(time).catch(() => {});
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
  await this.page.locator(`label:has-text("${label}") ~ * input[type="date"], input[type="date"][name*="${label}"]`).first().fill(date);
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
  await this.page.locator(`label:has-text("${label}") ~ * input[type="time"], input[type="time"][name*="${label}"]`).first().fill(time);
});

/**
 * Fill the `start` half of a date-range pair.
 *
 * Example #1: When I fill in the start datetime field "Event" with date "2026-05-08" and time "10:00"
 * Example #2: When I fill in the start datetime field "Trip" with date "2026-12-31" and time "08:00"
 * Example #3: And we fill in the start datetime field "Window" with date "2026-07-04" and time "12:00"
 * Example #4: When I fill in the start datetime field "Promo" with date "2026-01-01" and time "00:00"
 * Example #5: When I fill in the start datetime field "Booking" with date "2026-09-15" and time "14:00"
 *
 */
When(/^(I |we )*fill in the start datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$/, async function (pronoun, label, date, time) {
  await this.page.locator(`input[name*="${label}"][name*="start"][type="date"]`).first().fill(date).catch(() => {});
  await this.page.locator(`input[name*="${label}"][name*="start"][type="time"]`).first().fill(time).catch(() => {});
});

/**
 * Fill the `end` half of a date-range pair.
 *
 * Example #1: When I fill in the end datetime field "Event" with date "2026-05-09" and time "18:00"
 * Example #2: When I fill in the end datetime field "Trip" with date "2027-01-07" and time "20:00"
 * Example #3: And we fill in the end datetime field "Window" with date "2026-07-04" and time "18:00"
 * Example #4: When I fill in the end datetime field "Promo" with date "2026-01-31" and time "23:59"
 * Example #5: When I fill in the end datetime field "Booking" with date "2026-09-15" and time "16:00"
 *
 */
When(/^(I |we )*fill in the end datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$/, async function (pronoun, label, date, time) {
  await this.page.locator(`input[name*="${label}"][name*="end"][type="date"]`).first().fill(date).catch(() => {});
  await this.page.locator(`input[name*="${label}"][name*="end"][type="time"]`).first().fill(time).catch(() => {});
});

// ---------------------------------------------------------------------------
// Field text content + checkbox / radio state assertions
// (relocated from webship.js; field-related assertions live in this file).
// ---------------------------------------------------------------------------

const { Then: ThenF } = require('@cucumber/cucumber');
const assertF = require('assert');
const { getLocatorText: getLocatorTextF } = require('./webship');

/**
 * Assert that a form field contains or does not contain specific text.
 *
 * Example #1: Then the "Username" field should contain "John Smith"
 * Example #2: Then the "#username" field should not contain "John Smith"
 * Example #3: And the "Email" field should contain "jon@example.com"
 *
 */
ThenF(/^(the )*"([^"]*)?" field should( not)* contain "([^"]*)?"$/, async function (theCase, field, notCase, expectedText) {
  let selector = field;
  if (!field.startsWith('#') && !field.startsWith('.')) {
    const forAttr = await this.page.getByText(field, { exact: true }).getAttribute('for').catch(() => null);
    if (forAttr) selector = '#' + forAttr;
  }
  const loc = this.page.locator(selector).first();
  await loc.waitFor({ timeout: 5000 });
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
 * Example #1: Then the "#privacy-policy" checkbox should be checked
 * Example #2: Then the "#newsletter" checkbox should not be checked
 * Example #3: And the "#agree" checkbox should be checked
 * Example #4: Then the ".terms" checkbox should not be checked
 * Example #5: When I check "Remember me"
 *               Then the "#remember" checkbox should be checked
 *
 */
ThenF(/^(the )*"([^"]*)?" checkbox should( not)* be checked$/, async function (theCase, checkbox, notCase) {
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assertF.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a checkbox is or is not checked.
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
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assertF.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a named checkbox should or should not be checked.
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
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assertF.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a named checkbox is or is not checked.
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
  const isChecked = await this.page.locator(checkbox).isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Checkbox "${checkbox}" should NOT be checked but it is.`);
  } else {
    assertF.ok(isChecked, `Checkbox "${checkbox}" should be checked but it is not.`);
  }
});

/**
 * Assert that a radio button should or should not be selected.
 *
 * Example #1: Then the radio button "#gender-male" should be selected
 * Example #2: Then the radio button "#gender-female" should not be selected
 * Example #3: Then the radio button ".option-1" should be selected
 *
 */
ThenF(/^(the )*radio button "([^"]*)?" should( not)* be selected$/, async function (theCase, radioButton, notCase) {
  const isChecked = await this.page.locator(radioButton).isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assertF.ok(isChecked, `Radio button "${radioButton}" should be selected but it is not.`);
  }
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
  const isChecked = await this.page.locator(`input[type="radio"][value="${radioValue}"]`).first().isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Radio button with value "${radioValue}" should NOT be selected but it is.`);
  } else {
    assertF.ok(isChecked, `Radio button with value "${radioValue}" should be selected but it is not.`);
  }
});

/**
 * Assert that the radio button is or is not selected.
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
  const isChecked = await this.page.locator(radioButton).isChecked();
  if (notCase) {
    assertF.ok(!isChecked, `Radio button "${radioButton}" should NOT be selected but it is.`);
  } else {
    assertF.ok(isChecked, `Radio button "${radioButton}" should be selected but it is not.`);
  }
});
