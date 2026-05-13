'use strict';

// All "do an action" step definitions live here:
// press, click (text / attr / row / link follow), and file attach.

const { When } = require('@cucumber/cucumber');
const path = require('path');
const { buildSelector, friendly } = require('./webship');

// Wrap a Playwright action with a friendlier error pointing at the
// failing locator + Gherkin step. Pass `label` describing the step
// ("press button", "click link", ...) and the user-supplied target.
async function actOrExplain(label, target, fn) {
  try {
    await fn();
  } catch (e) {
    const msg = (e.message || '').split('\n')[0];
    throw friendly(
      `Failed to ${label} "${target}".\n` +
      `  ${msg}\n` +
      `  Hints:\n` +
      `    - Check the visible text matches exactly (case-sensitive).\n` +
      `    - Use the "by attr" variant if the element has no readable text.\n` +
      `    - Use "wait for ... to appear" if the element renders late.`
    );
  }
}

// ---------------------------------------------------------------------------
// Press / click — by visible text
// ---------------------------------------------------------------------------

/**
 * Press a button, submit input, or link by its visible text.
 *
 * Example #1: When I press "Log In"
 * Example #2: And I press the "Log In" button
 * Example #3: And I press the "Save as" button
 * Example #4: When we press "Submit"
 * Example #5: And press "Cancel"
 *
 */
When(/^(I |we )*press( the)* "([^"]*)?"( button)*$/, async function (pronounCase, theCase, element, buttonCase) {
  const esc = element.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const page = this.page;
  await actOrExplain('press button', element, async () => {
    await page.locator('button, input[type="button"], input[type="submit"], [role="button"], a')
      .filter({ hasText: new RegExp('^' + esc + '$') })
      .first()
      .click();
  });
});

/**
 * Press a button by its attribute (id, class, name, placeholder, data-*).
 *
 * Example #1: When I press "btn-pressid" by attr
 * Example #2: When I press "btn-pressid" by attribute
 * Example #3: And I press "Your full name" by "placeholder" attribute
 * Example #4: And I press "Your full name" by its "placeholder" attribute
 * Example #5: And I press "save-name" by "data-selector" attr
 *
 */
When(/^(I |we )*press "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().click();
});

/**
 * Click a link or button by its visible text.
 *
 * Example #1: When I click "Contact Us"
 * Example #2: And I click "aboutUs"
 * Example #3: When we click "Read more"
 * Example #4: And click "Home"
 *
 */
When(/^(I |we )*click "([^"]*)?"$/, async function (pronounCase, item) {
  const esc = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const page = this.page;
  await actOrExplain('click', item, async () => {
    await page.locator('a, button, [role="button"], input[type="button"], input[type="submit"]')
      .filter({ hasText: new RegExp('^' + esc + '$') })
      .first()
      .click();
  });
});

/**
 * Click a link or button by its attribute (id, class, name, data-*).
 *
 * Example #1: When I click "#about-us-id" by attr
 * Example #2: When I click "data-selector-about" by attribute
 * Example #3: And I click "about-us-css" by "class" attr
 * Example #4: And I click "about-us-id" by its "id" attribute
 *
 */
When(/^(I |we )*click "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$/, async function (pronounCase, attrValue, itsCase, attr, attrWord) {
  await this.page.locator(buildSelector(attrValue, attr)).first().click();
});

/**
 * Click a clickable element inside a table row identified by text.
 *
 * Example #1: When I click "Edit" in the "John Smith" row
 * Example #2: When I click "Delete" in the "Product A" row
 * Example #3: When we click "View Details" in the "Order #12345" row
 * Example #4: And I click "Download" in the "Report 2024" row
 *
 */
When(/^(I |we )*click "([^"]*)?" in( the)* "([^"]*)?" row$/, async function (pronounCase, clickText, theCase, rowIdentifier) {
  const esc = clickText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = this.page.locator('tr').filter({ hasText: rowIdentifier }).first();
  const clickable = row.locator('a, button, [role="button"], input[type="submit"], input[type="button"]')
    .filter({ hasText: new RegExp('^' + esc + '$') });
  if (await clickable.count() > 0) {
    await clickable.first().click();
  } else {
    await row.getByText(clickText, { exact: true }).first().click();
  }
});

/**
 * Follow a link by its visible text.
 * Uses Playwright's accessibility-first `getByRole('link', { name })` with a
 * text-match fallback.
 *
 * Example #1: When I follow "Contact Us"
 * Example #2: When I follow "About"
 * Example #3: When we follow "Home"
 * Example #4: And follow "Read more"
 * Example #5: When I follow "Documentation"
 * Example #6: When we follow "Sign in"
 * Example #7: When I follow "Log out"
 * Example #8: When I follow "Download report"
 * Example #9: And I follow "Previous"
 * Example #10: When I follow "Next"
 */
When(/^(I |we )*follow "([^"]*)"$/, async function (pronounCase, link) {
  const esc = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const page = this.page;
  await actOrExplain('follow link', link, async () => {
    const loc = page.getByRole('link', { name: link, exact: true }).or(
      page.locator('a').filter({ hasText: new RegExp('^' + esc + '$') })
    ).first();
    await loc.click();
  });
});

/**
 * Attach a file from tests/assets/ to a file input.
 *
 * The file path is resolved against `this.assetsFolder` (default
 * `tests/assets/`). The target selector must address an `<input type="file">`.
 *
 * Example #1: When I attach the file "profile-icon.jpg" to "#profile-icon-upload"
 * Example #2: When we attach file "resume.pdf" to "#resume"
 * Example #3: And I attach the file "logo.svg" to "input[name=logo]"
 * Example #4: When I attach file "report-2026-q1.csv" to "[data-testid=csv-upload]"
 * Example #5: Given I am on "/upload"
 *               When I attach the file "video.mp4" to "#video-input"
 *               And I press "Upload"
 *               Then I should see "Upload complete"
 *
 */
When(/^(I |we )*attach( the)* file "([^"]*)?" to "([^"]*)?"$/, async function (pronounCase, theCase, fileName, element) {
  await this.page.locator(element).setInputFiles(path.resolve(this.assetsFolder, fileName));
});
