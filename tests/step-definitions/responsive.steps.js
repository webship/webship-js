'use strict';

// Set viewport dimensions and named breakpoints.

const { Given, When } = require('@cucumber/cucumber');

const DEFAULT_BREAKPOINTS = {
  xs: { width: 375, height: 667 },
  sm: { width: 576, height: 800 },
  md: { width: 768, height: 1024 },
  lg: { width: 992, height: 768 },
  xl: { width: 1200, height: 900 },
  xxl: { width: 1400, height: 900 },
  xxxl: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 900 },
};

function getBreakpoints(world) {
  if (!world._breakpoints) {
    const cfg = (world.parameters && world.parameters.selectors && world.parameters.selectors.breakpoints) || {};
    world._breakpoints = { ...DEFAULT_BREAKPOINTS, ...cfg };
  }
  return world._breakpoints;
}

/**
 * Replace the breakpoint registry for the current scenario from a data table.
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
  const map = {};
  for (const row of table.raw()) {
    const [name, w, h] = row;
    map[name] = { width: parseInt(w, 10), height: parseInt(h, 10) };
  }
  this._breakpoints = { ...DEFAULT_BREAKPOINTS, ...map };
});

/**
 * Resize the viewport to a registered named breakpoint.
 *
 * Built-in names: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl`, `mobile`,
 * `tablet`, `desktop`. Project-defined names override built-ins.
 *
 * Example #1: When I set the viewport to the "mobile" breakpoint
 * Example #2: When I set the viewport to the "tablet" breakpoint
 * Example #3: And we set the viewport to the "desktop" breakpoint
 * Example #4: When I set the viewport to the "xl" breakpoint
 * Example #5: When I set the viewport to the "xxxl" breakpoint
 *
 */
When(/^(I |we )*set the viewport to the "([^"]*)" breakpoint$/, async function (pronoun, name) {
  const bps = getBreakpoints(this);
  const bp = bps[name];
  if (!bp) throw new Error(`Unknown breakpoint "${name}".`);
  await this.page.setViewportSize({ width: bp.width, height: bp.height });
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
