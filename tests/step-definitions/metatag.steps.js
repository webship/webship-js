'use strict';

// Assert <meta> tag presence and contents.

const { Then } = require('@cucumber/cucumber');
const assert = require('assert');

async function getMetas(page) {
  return await page.evaluate(() => Array.from(document.querySelectorAll('meta')).map((m) => {
    const o = {};
    for (const a of m.attributes) o[a.name] = a.value;
    return o;
  }));
}

function matchAttrs(meta, attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    if (meta[k] !== v) return false;
  }
  return true;
}

/**
 * Assert at least one `<meta>` tag matches every attribute in the data table.
 *
 * Example #1: Then the meta tag should exist with the following attributes:
 *               | name    | description                |
 *               | content | Documentation site          |
 * Example #2: Then the meta tag should exist with the following attributes:
 *               | property | og:title    |
 *               | content  | Home        |
 * Example #3: And the meta tag should exist with the following attributes:
 *               | name    | viewport                          |
 *               | content | width=device-width, initial-scale=1 |
 * Example #4: Then the meta tag should exist with the following attributes:
 *               | name    | robots         |
 *               | content | noindex,nofollow |
 * Example #5: Then the meta tag should exist with the following attributes:
 *               | charset | UTF-8 |
 *
 */
Then('the meta tag should exist with the following attributes:', async function (table) {
  const want = Object.fromEntries(table.raw());
  const metas = await getMetas(this.page);
  assert.ok(metas.some((m) => matchAttrs(m, want)), `No meta tag matching ${JSON.stringify(want)} was found.`);
});

/**
 * Assert NO `<meta>` tag matches every attribute in the data table.
 *
 * Example #1: Then the meta tag should not exist with the following attributes:
 *               | name    | description     |
 *               | content | Coming soon     |
 * Example #2: Then the meta tag should not exist with the following attributes:
 *               | name    | robots          |
 *               | content | noindex         |
 * Example #3: And the meta tag should not exist with the following attributes:
 *               | property | og:title       |
 *               | content  | Placeholder    |
 * Example #4: Then the meta tag should not exist with the following attributes:
 *               | http-equiv | refresh       |
 *               | content    | 5             |
 * Example #5: Then the meta tag should not exist with the following attributes:
 *               | name    | author          |
 *               | content | Anonymous       |
 *
 */
Then('the meta tag should not exist with the following attributes:', async function (table) {
  const want = Object.fromEntries(table.raw());
  const metas = await getMetas(this.page);
  assert.ok(!metas.some((m) => matchAttrs(m, want)), `Meta tag matching ${JSON.stringify(want)} should not exist.`);
});

/**
 * Assert the `content` attribute of a named meta tag contains no HTML markup.
 * Useful for description / open-graph fields that should render as plain text.
 *
 * Example #1: Then the "description" meta tag should not contain any HTML tags
 * Example #2: Then the "og:title" meta tag should not contain any HTML tags
 * Example #3: And the "twitter:description" meta tag should not contain any HTML tags
 * Example #4: Then the "keywords" meta tag should not contain any HTML tags
 * Example #5: Then the "author" meta tag should not contain any HTML tags
 *
 */
Then('the {string} meta tag should not contain any HTML tags', async function (metaName) {
  const metas = await getMetas(this.page);
  const m = metas.find((x) => x.name === metaName || x.property === metaName);
  assert.ok(m, `Meta tag "${metaName}" not found.`);
  const content = m.content || '';
  assert.ok(!/<[a-z][\s\S]*>/i.test(content), `Meta tag "${metaName}" contains HTML: ${content}`);
});
