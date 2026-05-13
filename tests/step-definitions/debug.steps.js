'use strict';

// Debug helpers — print current URL, full HTML response, etc. Use sparingly
// and strip before merging.

const { Then } = require('@cucumber/cucumber');

/**
 * Print the current page URL to console (debug).
 *
 * Example #1: Then print current URL
 * Example #2: When print current URL
 * Example #3: And print current URL
 */
Then(/^print current URL$/, function () {
  try {
    console.log('\n--- Current URL ---');
    console.log(`  ${this.page.url()}`);
  } catch (e) {
    console.log(`\n--- Current URL unavailable: ${e.message} ---`);
  }
});

/**
 * Print the full page HTML (last response) to console (debug).
 *
 * Example #1: Then print last response
 * Example #2: When print last response
 * Example #3: And print last response
 */
Then(/^print last response$/, async function () {
  try {
    const html = await this.page.content();
    console.log('\n--- Last Response (HTML) ---');
    console.log(html);
  } catch (e) {
    console.log(`\n--- Last response unavailable: ${e.message} ---`);
  }
});
