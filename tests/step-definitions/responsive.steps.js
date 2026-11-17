'use strict';

const { friendly, breakpoint } = require('./webship');

// Set viewport dimensions and named breakpoints. The named sizes come from
// the one breakpoint registry of webship.js: the built-in names (xs, sm, md,
// lg, xl, xxl, xxxl, mobile, tablet, desktop), then
// worldParameters.selectors.breakpoints, then WEBSHIP_SELECTORS_BREAKPOINTS,
// then the names a scenario adds with "the following responsive breakpoints:".

const { Given, When } = require('@cucumber/cucumber');

/**
 * Add named breakpoints for the current scenario from a data table: one row
 * per name, `| name | width | height |`. The names replace the sizes of the
 * same names; every other breakpoint (built in or configured) stays.
 *
 * Example #1: Given the following responsive breakpoints:
 *               | mobile  | 375  | 667  |
 *               | tablet  | 768  | 1024 |
 *               | desktop | 1200 | 900  |
 * Example #2: Given the following responsive breakpoints:
 *               | watch   | 280  | 280  |
 *               | phablet | 414  | 896  |
 * Example #3: And the following responsive breakpoints:
 *               | xs      | 320  | 480  |
 *               | sm      | 480  | 800  |
 * Example #4: Given the following responsive breakpoints:
 *               | hd      | 1280 | 720  |
 *               | full-hd | 1920 | 1080 |
 * Example #5: Given the following responsive breakpoints:
 *               | a11y    | 320  | 480  |
 *               | print   | 794  | 1123 |
 *
 */
Given('the following responsive breakpoints:', async function (table) {
  const added = {};
  for (const row of table.raw()) {
    const [name, w, h] = row;
    const width = parseInt(w, 10);
    const height = parseInt(h, 10);
    if (!name || !(width > 0) || !(height > 0)) {
      throw friendly(
        `The breakpoint row | ${row.join(' | ')} | is not a name, a width and a height.\n` +
        '  Hint: write each row as | name | width | height |, with the sizes in whole pixels, such as | tablet | 768 | 1024 |.'
      );
    }
    added[name.trim()] = { width, height };
  }
  this.__scenarioBreakpoints = Object.assign({}, this.__scenarioBreakpoints, added);
});

/**
 * Resize the viewport to a named breakpoint.
 *
 * Built-in names: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl`, `mobile`,
 * `tablet`, `desktop`. A project's names (worldParameters.selectors.breakpoints,
 * WEBSHIP_SELECTORS_BREAKPOINTS) and a scenario's own (the table step above)
 * replace the built-in sizes of the same names. An unknown name fails with
 * the list of the known ones.
 *
 * Example #1: When I set the viewport to the "mobile" breakpoint
 * Example #2: When I set the viewport to the "tablet" breakpoint
 * Example #3: And we set the viewport to the "desktop" breakpoint
 * Example #4: When I set the viewport to the "xl" breakpoint
 * Example #5: When I set the viewport to the "xxxl" breakpoint
 *
 */
When(/^(I |we )*set the viewport to the "([^"]*)" breakpoint$/, async function (pronoun, name) {
  await this.page.setViewportSize(breakpoint(this, name));
});

/**
 * Resize the viewport width while keeping the current height.
 *
 * Example #1: When I set the viewport width to 1200
 * Example #2: When I set the viewport width to 375
 * Example #3: And we set the viewport width to 1920
 * Example #4: When I set the viewport width to 768
 * Example #5: When I set the viewport width to 1024
 *
 */
When(/^(I |we )*set the viewport width to (\d+)$/, async function (pronoun, w) {
  w = parseInt(w, 10);
  const cur = this.page.viewportSize() || { height: 800 };
  await this.page.setViewportSize({ width: w, height: cur.height });
});

/**
 * Resize the viewport height while keeping the current width.
 *
 * Example #1: When I set the viewport height to 800
 * Example #2: When I set the viewport height to 1024
 * Example #3: And we set the viewport height to 1080
 * Example #4: When I set the viewport height to 667
 * Example #5: When I set the viewport height to 900
 *
 */
When(/^(I |we )*set the viewport height to (\d+)$/, async function (pronoun, h) {
  h = parseInt(h, 10);
  const cur = this.page.viewportSize() || { width: 1200 };
  await this.page.setViewportSize({ width: cur.width, height: h });
});

/**
 * Resize the viewport to an explicit width-by-height pair.
 *
 * Example #1: When I set the viewport to 1200 by 800
 * Example #2: When I set the viewport to 375 by 667
 * Example #3: And we set the viewport to 1920 by 1080
 * Example #4: When I set the viewport to 768 by 1024
 * Example #5: When I set the viewport to 1024 by 768
 *
 */
When(/^(I |we )*set the viewport to (\d+) by (\d+)$/, async function (pronoun, w, h) {
  w = parseInt(w, 10); h = parseInt(h, 10);
  await this.page.setViewportSize({ width: w, height: h });
});
