'use strict';

// All form interaction step definitions live here:
// fill in (label, attribute, table), select / additionally select,
// check / uncheck, radio buttons.

const { When } = require('@cucumber/cucumber');
const { buildSelector, fillField } = require('./webship');

// ---------------------------------------------------------------------------
// Fill — by label, attribute, table, reverse syntax
// ---------------------------------------------------------------------------

/**
 * Fill an input field located by its label, placeholder, or name.
 *
 * Example #1: When I fill in "Username" with "John Smith"
 * Example #2: When I fill in "Email" with "jon@example.com"
 * Example #3: And we fill in "Organization" with "Webship.co"
 * Example #4: And I fill in "Password" with "1234"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?"$/, async function (pronounCase, field, value) {
  await fillField(this.page, field, value);
});

/**
 * Fill an input field located by its attribute.
 *
 * Example #1: When I fill in "#uname" with "John Smith" by attr
 * Example #2: When I fill in "uname" with "John Smith" by attr
 * Example #3: And I fill in "pwordcss" with "1234" by "class" attr
 * Example #4: And I fill in "Your full name" with "John Smith" by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill(txtValue);
});

/**
 * Clear an input field located by its label.
 *
 * Example #1: When I fill in "Username" with:
 * Example #2: And we fill in "Email" with:
 * Example #3: And I fill in "Password" with:
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with:$/, async function (pronounCase, field) {
  await fillField(this.page, field, '');
});

/**
 * Clear an input field located by its attribute.
 *
 * Example #1: When I fill in "#uname" with: by attr
 * Example #2: When I fill in "uname" with: by attr
 * Example #3: And I fill in "pwordcss" with: by "class" attr
 * Example #4: And I fill in "Your full name" with: by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill('');
});

/**
 * Fill an input field located by label (reverse syntax).
 *
 * Example #1: When I fill in "jon-smith" for "Username"
 * Example #2: When we fill in "Testing" for "Organization options"
 * Example #3: And I fill in "1234" for "Password"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, async function (pronounCase, value, field) {
  await fillField(this.page, field, value);
});

/**
 * Fill an input field located by attribute (reverse syntax).
 *
 * Example #1: When I fill in "John Smith" for "#uname" by attr
 * Example #2: When I fill in "John Smith" for "uname" by attr
 * Example #3: And I fill in "1234" for "password" by "class" attr
 * Example #4: And I fill in "John Smith" for "Your full name" by its "placeholder" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().fill(txtValue);
});

/**
 * Fills multiple form fields from a data table, located by their labels.
 *
 * Each row is `| label | value |`. Labels resolve via `<label for=...>`,
 * `placeholder`, or `[name]` — whichever matches first.
 *
 * Example #1: When I fill in the following:
 *               | Username | webshipco       |
 *               | Password | s3cret          |
 * Example #2: When we fill in the following:
 *               | Email        | jon@example.com  |
 *               | Organization | Webship.co       |
 * Example #3: And I fill in the following:
 *               | First name | Alice         |
 *               | Last name  | Smith         |
 *               | Country    | Jordan        |
 * Example #4: When I fill in the following:
 *               | Subject  | Bug report                  |
 *               | Message  | The submit button is hidden |
 * Example #5: When I fill in the following:
 *               | Card number | 4242 4242 4242 4242 |
 *               | Expiry      | 12/30               |
 *               | CVV         | 123                 |
 *
 */
When(/^(I |we )*fill in( the)* following:$/, async function (pronounCase, theCase, table) {
  for (const [field, value] of table.raw()) {
    await fillField(this.page, field, value);
  }
});

/**
 * Fills multiple form fields from a data table, located by attribute.
 *
 * Without an explicit attribute, each key is matched against id / class /
 * name / data-testid / data-test-id / data-test / data-cy / aria-label /
 * value / placeholder / title.
 *
 * Example #1: When I fill in the following: by attr
 *               | #uname     | John Smith        |
 *               | password   | s3cret            |
 * Example #2: When I fill in the following: by its "placeholder" attribute
 *               | Your full name | John Smith    |
 *               | Your Password  | s3cret        |
 * Example #3: When I fill in the following: by attribute
 *               | [data-testid=email]    | a@b.c   |
 *               | [data-testid=username] | alice   |
 * Example #4: When we fill in the following: by attr
 *               | first-name | Alice  |
 *               | last-name  | Smith  |
 * Example #5: When I fill in the following: by its "name" attribute
 *               | card_number | 4242 4242 4242 4242 |
 *               | exp_date    | 12/30               |
 *
 */
When(/^(I |we )*fill in( the)* following: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, theCase, itsCase, attr, attrWord, table) {
  for (const [attrValue, value] of table.raw()) {
    await this.page.locator(buildSelector(attrValue, attr)).first().fill(value);
  }
});

// ---------------------------------------------------------------------------
// Select dropdown
// ---------------------------------------------------------------------------

/**
 * Select an option from a dropdown by label, id, class, or name.
 *
 * Example #1: When I select "Mercedes" from "Cars"
 * Example #2: When I select "saab" from "#cars"
 * Example #3: When I select "Mercedes" from "cars"
 * Example #4: And we select "English" from "Language"
 *
 */
When(/^(I |we )*select "([^"]*)?" from "([^"]*)?"$/, async function (pronounCase, option, selectList) {
  let loc;
  if (selectList.startsWith('#') || selectList.startsWith('.')) {
    loc = this.page.locator(selectList);
  } else if (!selectList.includes(' ')) {
    loc = this.page.locator(`[name="${selectList}"], #${selectList}`).first();
  } else {
    loc = this.page.getByLabel(selectList, { exact: true });
  }
  try {
    await loc.selectOption({ label: option }, { timeout: 3000 });
    return;
  } catch { /* fall through to value-based selection */ }
  try {
    await loc.selectOption(option);
  } catch (e) {
    throw new Error(
      `Could not select "${option}" from "${selectList}".\n` +
      `  ${(e.message || '').split('\n')[0]}\n` +
      `  Hints:\n` +
      `    - Confirm the option text matches exactly (case-sensitive).\n` +
      `    - For value-based selection pass the option's "value" attribute.\n` +
      `    - For multi-select, use "additionally select" instead.`
    );
  }
});

/**
 * Add an option to a <select multiple> without clearing the existing selection.
 * Resolves the select by label, then by [name]/#id fallback.
 *
 * Example #1: When I additionally select "Red" from "Colors"
 * Example #2: When I additionally select "Blue" from "Colors"
 * Example #3: When we additionally select "Green" from "Colors"
 * Example #4: And additionally select "Yellow" from "Colors"
 * Example #5: When I additionally select "Admin" from "Roles"
 * Example #6: When we additionally select "Editor" from "Roles"
 * Example #7: When I additionally select "Viewer" from "Roles"
 * Example #8: And I additionally select "EN" from "Languages"
 * Example #9: When I additionally select "FR" from "Languages"
 * Example #10: When we additionally select "ES" from "Languages"
 *
 * Advanced:
 * Example #11: Build a full multi-selection in sequence:
 *   When I select "Red" from "Colors"
 *   And  I additionally select "Blue" from "Colors"
 *   And  I additionally select "Green" from "Colors"
 * Example #12: Works against a [name] select:
 *   When I additionally select "tag-a" from "tags"
 *   And  I additionally select "tag-b" from "tags"
 * Example #13: Confirm the select stays multi-valued after adds:
 *   When I select "One" from "Items"
 *   And  I additionally select "Two" from "Items"
 */
When(/^(I |we )*additionally select "([^"]*)" from "([^"]*)"$/, async function (pronounCase, option, select) {
  const loc = this.page.getByLabel(select).or(
    this.page.locator(`select[name="${select}"], select#${select}`)
  ).first();

  const currentValues = await loc.evaluate((el) => {
    if (!el || !el.selectedOptions) return [];
    return Array.from(el.selectedOptions).map((o) => o.value);
  });

  const nextValueForLabel = await loc.evaluate((el, label) => {
    const opt = Array.from(el.options || []).find((o) => o.label === label || o.text === label);
    return opt ? opt.value : null;
  }, option);

  if (nextValueForLabel === null) {
    throw new Error(`Option "${option}" not found in select "${select}".`);
  }

  const combined = Array.from(new Set([...currentValues, nextValueForLabel]));
  await loc.selectOption(combined);
});

// ---------------------------------------------------------------------------
// Checkbox / radio
// ---------------------------------------------------------------------------

/**
 * Checks the specified checkbox by label, id, class, or name.
 *
 * Example #1: When I check "Remember me"
 * Example #2: When we check "Put site into maintenance mode"
 * Example #3: And I check "#newsletter"
 * Example #4: And we check ".terms-and-conditions"
 *
 */
When(/^(I |we )*check "([^"]*)?"$/, async function (pronounCase, item) {
  try {
    if (item.startsWith('#') || item.startsWith('.')) {
      await this.page.locator(item).check();
    } else {
      const byLabel = this.page.getByLabel(item, { exact: true });
      if (await byLabel.count() > 0) {
        await byLabel.check();
      } else {
        await this.page.locator(`input[type="checkbox"][id="${item}"], input[type="checkbox"][name="${item}"], input[type="checkbox"][value="${item}"]`).first().check();
      }
    }
  } catch (e) {
    throw new Error(
      `Could not check "${item}".\n` +
      `  ${(e.message || '').split('\n')[0]}\n` +
      `  Hints: confirm the label / id / class matches; ensure the input is visible and not disabled.`
    );
  }
});

/**
 * Unchecks the specified checkbox by label, id, class, or name.
 *
 * Example #1: When I uncheck "Remember me"
 * Example #2: When we uncheck "Put site into maintenance mode"
 * Example #3: And I uncheck "#newsletter"
 * Example #4: And we uncheck ".terms-and-conditions"
 *
 */
When(/^(I |we )*uncheck "([^"]*)?"$/, async function (pronounCase, item) {
  try {
    if (item.startsWith('#') || item.startsWith('.')) {
      await this.page.locator(item).uncheck();
    } else {
      const byLabel = this.page.getByLabel(item, { exact: true });
      if (await byLabel.count() > 0) {
        await byLabel.uncheck();
      } else {
        await this.page.locator(`input[type="checkbox"][id="${item}"], input[type="checkbox"][name="${item}"], input[type="checkbox"][value="${item}"]`).first().uncheck();
      }
    }
  } catch (e) {
    throw new Error(
      `Could not uncheck "${item}".\n` +
      `  ${(e.message || '').split('\n')[0]}\n` +
      `  Hints: confirm the label / id / class matches; ensure the input is visible and not disabled.`
    );
  }
});

/**
 * Selects a radio button by label, value, id, or class.
 *
 * Example #1: When I select radio button "Male"
 * Example #2: When I select radio button "female"
 * Example #3: When I select radio button "#gender-male"
 * Example #4: When we select radio button "option1"
 *
 */
When(/^(I |we )*select radio button "([^"]*)?"$/, async function (pronounCase, item) {
  try {
    if (item.startsWith('#') || item.startsWith('.')) {
      await this.page.locator(item).check();
    } else {
      const byValue = this.page.locator(`input[type="radio"][value="${item}"]`);
      if (await byValue.count() > 0) {
        await byValue.first().check();
      } else {
        await this.page.getByLabel(item, { exact: true }).check();
      }
    }
  } catch (e) {
    throw new Error(
      `Could not select radio button "${item}".\n` +
      `  ${(e.message || '').split('\n')[0]}\n` +
      `  Hints: try matching by [value=...], by label text, or by #id / .class.`
    );
  }
});
