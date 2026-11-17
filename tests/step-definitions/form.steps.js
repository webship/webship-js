'use strict';

// All form interaction step definitions live here:
// fill in (label, attribute, table), select / additionally select,
// check / uncheck, radio buttons.

const { When } = require('@cucumber/cucumber');
const { buildSelector, fillField, fillLocator, friendly, failure, humanize, isTimeout } = require('./webship');

// ---------------------------------------------------------------------------
// Fill — by label, attribute, table, reverse syntax
// ---------------------------------------------------------------------------

/**
 * Fill an input field located by its label, placeholder, or name.
 * An empty value ("") empties the field.
 *
 * Example #1: When I fill in "Username" with "John Smith"
 * Example #2: When I fill in "Email" with "jon@example.com"
 * Example #3: And we fill in "Organization" with "Webship.co"
 * Example #4: And I fill in "Password" with "1234"
 * Example #5: When we fill in "Search" with "webship"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?"$/, async function (pronounCase, field, value) {
  await fillField(this.page, field, value, this);
});

/**
 * Fill an input field located by its attribute. An empty value ("") empties
 * the field.
 *
 * Example #1: When I fill in "#uname" with "John Smith" by attr
 * Example #2: When I fill in "uname" with "John Smith" by attr
 * Example #3: And I fill in "pwordcss" with "1234" by "class" attr
 * Example #4: And I fill in "Your full name" with "John Smith" by its "placeholder" attribute
 * Example #5: When we fill in "email" with "jon@example.com" by its "name" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, txtValue, itsCase, attr, attrWord) {
  await fillLocator(this.page, this.page.locator(buildSelector(attrValue, attr)).first(), txtValue, attrValue);
});

/**
 * Clear an input field located by its label.
 *
 * Example #1: When I fill in "Username" with:
 * Example #2: And we fill in "Email" with:
 * Example #3: And I fill in "Password" with:
 * Example #4: When we fill in "Search" with:
 * Example #5: When I fill in "Comment" with:
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with:$/, async function (pronounCase, field) {
  await fillField(this.page, field, '', this);
});

/**
 * Clear an input field located by its attribute.
 *
 * Example #1: When I fill in "#uname" with: by attr
 * Example #2: When I fill in "uname" with: by attr
 * Example #3: And I fill in "pwordcss" with: by "class" attr
 * Example #4: And I fill in "Your full name" with: by its "placeholder" attribute
 * Example #5: When we fill in "email" with: by its "name" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await fillLocator(this.page, this.page.locator(buildSelector(attrValue, attr)).first(), '', attrValue);
});

/**
 * Fill an input field located by label (reverse syntax). An empty value ("")
 * empties the field.
 *
 * Example #1: When I fill in "jon-smith" for "Username"
 * Example #2: When we fill in "Testing" for "Organization options"
 * Example #3: And I fill in "1234" for "Password"
 * Example #4: When we fill in "jon@example.com" for "Email"
 * Example #5: And I fill in "Webship" for "Search"
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$/, async function (pronounCase, value, field) {
  await fillField(this.page, field, value, this);
});

/**
 * Fill an input field located by attribute (reverse syntax). An empty value
 * ("") empties the field.
 *
 * Example #1: When I fill in "John Smith" for "#uname" by attr
 * Example #2: When I fill in "John Smith" for "uname" by attr
 * Example #3: And I fill in "1234" for "password" by "class" attr
 * Example #4: And I fill in "John Smith" for "Your full name" by its "placeholder" attribute
 * Example #5: When we fill in "jon@example.com" for "email" by its "name" attribute
 *
 */
When(/^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, txtValue, attrValue, itsCase, attr, attrWord) {
  await fillLocator(this.page, this.page.locator(buildSelector(attrValue, attr)).first(), txtValue, attrValue);
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
    await fillField(this.page, field, value, this);
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
    await fillLocator(this.page, this.page.locator(buildSelector(attrValue, attr)).first(), value, attrValue);
  }
});

// ---------------------------------------------------------------------------
// Select dropdown
// ---------------------------------------------------------------------------

/**
 * Find the `<select>` a step names. A CSS selector (it starts with `#`, `.`
 * or `[`) is used as written; any other text is the exact text of the label
 * of the select list, else its name, else its id, whatever its length.
 *
 * @param {import('playwright').Page} page
 * @param {string} name
 * @returns {import('playwright').Locator}
 */
function selectList(page, name) {
  if (/^[#.[]/.test(name)) return page.locator(name).first();
  const value = name.replace(/["\\]/g, '\\$&');
  return page.getByLabel(name, { exact: true })
    .or(page.locator(`select[name="${value}"]`))
    .or(page.locator(`select[id="${value}"]`))
    .first();
}

/**
 * Select an option from a dropdown by label, id, class, or name.
 *
 * The select list is named by the exact text of its label (one word or
 * several), by its name, by its id, or by a CSS selector that starts with
 * `#`, `.` or `[`. The option is named by its text, else by its value. A
 * select list that is not on the page after 5 seconds, or that has no such
 * option, fails the step at once with the options it has.
 *
 * Example #1: When I select "Mercedes" from "Cars"
 * Example #2: When I select "saab" from "#cars"
 * Example #3: When I select "Mercedes" from "cars"
 * Example #4: And we select "English" from "Language"
 * Example #5: When I select "Red" from "filters[colour]"
 *
 */
When(/^(I |we )*select "([^"]*)?" from "([^"]*)?"$/, async function (pronounCase, option, selectName) {
  const loc = selectList(this.page, selectName);
  try {
    await loc.waitFor({ state: 'attached', timeout: 5000 });
  } catch (e) {
    if (!isTimeout(e)) throw e;
    throw failure(this.page, /^[#.[]/.test(selectName)
      ? `No select list matches "${selectName}" after 5 seconds.`
      : `No select list with the label, the name or the id "${selectName}" was found after 5 seconds.`, {
      hint: 'name the select list by the exact text of its label, by its name or its id, or by a CSS selector that starts with #, . or [.',
    });
  }
  try {
    await loc.selectOption({ label: option }, { timeout: 3000 });
    return;
  } catch { /* fall through to value-based selection */ }
  try {
    await loc.selectOption(option, { timeout: 2000 });
  } catch (e) {
    const options = await loc.evaluate((el) => Array.from(el.options || []).map((o) => o.label || o.text)).catch(() => []);
    const listed = options.length ? options.map((o) => `"${o}"`).join(', ') : 'no option';
    if (!isTimeout(e) || options.includes(option)) {
      throw failure(this.page, `Could not select "${option}" from "${selectName}".`, {
        found: listed,
        hint: `${humanize(e)}. A select list that is hidden or disabled cannot be changed.`,
      });
    }
    throw failure(this.page, `The select list "${selectName}" has no option "${option}".`, {
      found: listed,
      hint: 'name the option by its text or by its value, as the page writes it (the letter case counts). For a select list that takes several options, use: I additionally select',
    });
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
    throw friendly(`Option "${option}" not found in select "${select}".`);
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
 * Example #5: When I check "I agree to the terms"
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
    throw friendly(
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
 * Example #5: When I uncheck "Send me the newsletter"
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
    throw friendly(
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
 * Example #5: And we select radio button "Monthly"
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
    throw friendly(
      `Could not select radio button "${item}".\n` +
      `  ${(e.message || '').split('\n')[0]}\n` +
      `  Hints: try matching by [value=...], by label text, or by #id / .class.`
    );
  }
});
