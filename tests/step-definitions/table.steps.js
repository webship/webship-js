'use strict';

// Inspect and assert HTML table contents.

const { Then } = require('@cucumber/cucumber');
const assert = require('assert');

async function getTable(page, sel) {
  return await page.locator(sel).first().evaluate((tbl) => {
    const rows = Array.from(tbl.querySelectorAll('tr'));
    const head = Array.from((tbl.querySelector('thead') || tbl).querySelectorAll('th')).map((c) => c.textContent.trim());
    const body = rows
      .filter((r) => r.querySelector('td'))
      .map((r) => Array.from(r.querySelectorAll('td')).map((c) => c.textContent.trim()));
    return { head, body, rowCount: body.length, colCount: (body[0] || head).length };
  });
}

/**
 * Assert a table has exactly N body rows.
 *
 * Example #1: Then the table "#users" should have 5 rows
 * Example #2: Then the table "table.orders" should have 1 row
 * Example #3: And the table "[data-testid=products]" should have 12 rows
 * Example #4: Then the table "#audit-log" should have 0 rows
 * Example #5: Then the table "table.responsive" should have 20 rows
 *
 */
Then('the table {string} should have {int} row(s)', async function (sel, count) {
  const t = await getTable(this.page, sel);
  assert.strictEqual(t.rowCount, count, `Table "${sel}" has ${t.rowCount} rows, expected ${count}.`);
});

/**
 * Assert a table has exactly N columns.
 *
 * Example #1: Then the table "#users" should have 4 columns
 * Example #2: Then the table "table.orders" should have 6 columns
 * Example #3: And the table "[data-testid=products]" should have 5 columns
 * Example #4: Then the table "#summary" should have 2 columns
 * Example #5: Then the table "table.responsive" should have 8 columns
 *
 */
Then('the table {string} should have {int} column(s)', async function (sel, count) {
  const t = await getTable(this.page, sel);
  assert.strictEqual(t.colCount, count, `Table "${sel}" has ${t.colCount} columns, expected ${count}.`);
});

/**
 * Assert the table header contains every column listed in the table.
 *
 * Example #1: Then the table "#users" should contain the following columns:
 *               | Name |
 *               | Email |
 * Example #2: Then the table "table.orders" should contain the following columns:
 *               | Order ID | Status | Total |
 * Example #3: And the table "[data-testid=products]" should contain the following columns:
 *               | Title | Price | Stock |
 * Example #4: Then the table "#audit-log" should contain the following columns:
 *               | Timestamp | Actor | Action |
 * Example #5: Then the table ".grid" should contain the following columns:
 *               | Country | Population | Capital |
 *
 */
Then('the table {string} should contain the following columns:', async function (sel, table) {
  const t = await getTable(this.page, sel);
  const want = table.raw().flat();
  for (const col of want) {
    assert.ok(t.head.includes(col), `Column "${col}" not found in [${t.head.join(', ')}].`);
  }
});

/**
 * Assert a table has zero body rows.
 *
 * Example #1: Then the table "#users" should be empty
 * Example #2: Then the table "table.orders" should be empty
 * Example #3: And the table "[data-testid=products]" should be empty
 * Example #4: Then the table "#audit-log" should be empty
 * Example #5: Then the table ".grid" should be empty
 *
 */
Then('the table {string} should be empty', async function (sel) {
  const t = await getTable(this.page, sel);
  assert.strictEqual(t.rowCount, 0, `Table "${sel}" should be empty.`);
});

/**
 * Assert a table has at least one body row.
 *
 * Example #1: Then the table "#users" should not be empty
 * Example #2: Then the table "table.orders" should not be empty
 * Example #3: And the table "[data-testid=products]" should not be empty
 * Example #4: Then the table "#audit-log" should not be empty
 * Example #5: Then the table ".grid" should not be empty
 *
 */
Then('the table {string} should not be empty', async function (sel) {
  const t = await getTable(this.page, sel);
  assert.ok(t.rowCount > 0, `Table "${sel}" should not be empty.`);
});

/**
 * Assert a table is sorted ascending or descending by a header.
 *
 * Direction accepts `ascending` / `asc` / `descending` / `desc`.
 *
 * Example #1: Then the table "#users" should be sorted by "Name" in "ascending" order
 * Example #2: Then the table "table.orders" should be sorted by "Total" in "descending" order
 * Example #3: And the table "[data-testid=products]" should be sorted by "Price" in "asc" order
 * Example #4: Then the table "#audit-log" should be sorted by "Timestamp" in "desc" order
 * Example #5: Then the table ".grid" should be sorted by "Country" in "ascending" order
 *
 */
Then('the table {string} should be sorted by {string} in {string} order', async function (sel, column, direction) {
  const t = await getTable(this.page, sel);
  const idx = t.head.findIndex((h) => h === column);
  assert.ok(idx !== -1, `Column "${column}" not found.`);
  const values = t.body.map((r) => r[idx]);
  const sorted = [...values].sort();
  if (direction.toLowerCase() === 'descending' || direction.toLowerCase() === 'desc') sorted.reverse();
  assert.deepStrictEqual(values, sorted, `Table "${sel}" not sorted by "${column}" ${direction}.`);
});

/**
 * Assert a table contains every row described by the data table (substring match per cell).
 *
 * Example #1: Then the table "#users" should contain the following rows:
 *               | Alice | Editor |
 *               | Bob   | Admin  |
 * Example #2: Then the table "table.orders" should contain the following rows:
 *               | 1234 | Shipped   |
 *               | 5678 | Cancelled |
 * Example #3: And the table "[data-testid=products]" should contain the following rows:
 *               | Laptop | $999.00 |
 * Example #4: Then the table "#audit-log" should contain the following rows:
 *               | login |
 * Example #5: Then the table ".grid" should contain the following rows:
 *               | Jordan | Amman |
 *
 */
Then('the table {string} should contain the following rows:', async function (sel, table) {
  const t = await getTable(this.page, sel);
  for (const row of table.raw()) {
    const found = t.body.some((br) => row.every((cell) => br.some((bc) => bc.indexOf(cell) !== -1)));
    assert.ok(found, `Row ${JSON.stringify(row)} not found in table.`);
  }
});

/**
 * Assert a row containing a given text fragment also contains every listed cell value.
 *
 * Example #1: Then the "Alice" row should contain the following:
 *               | Editor |
 *               | Active |
 * Example #2: Then the "Order #1234" row should contain the following:
 *               | Shipped |
 * Example #3: And the "Project Alpha" row should contain the following:
 *               | Open    |
 *               | High    |
 * Example #4: Then the "alice@example.com" row should contain the following:
 *               | Admin |
 * Example #5: Then the "Premium" row should contain the following:
 *               | $99 |
 *
 */
Then('the {string} row should contain the following:', async function (rowText, table) {
  const cells = table.raw().flat();
  // Find a tr whose text contains rowText.
  const trs = await this.page.locator('tr').all();
  let match = null;
  for (const tr of trs) {
    const txt = await tr.innerText();
    if (txt.indexOf(rowText) !== -1) { match = tr; break; }
  }
  assert.ok(match, `No row matching "${rowText}" was found.`);
  const text = await match.innerText();
  for (const c of cells) {
    assert.ok(text.indexOf(c) !== -1, `Row "${rowText}" does not contain "${c}".`);
  }
});
