'use strict';

// Validate file downloads triggered via URL or link click.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpDownloadDir() {
  const d = path.join(os.tmpdir(), `webship-dl-${process.pid}`);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

/**
 * Download the file at a URL using the browser's request context. The result
 * is captured on `this._lastDownload` for follow-up assertions.
 *
 * Relative paths are joined to `launchUrl`. Absolute URLs (`http(s)://...`)
 * are used as-is.
 *
 * Example #1: When I download the file from the URL "/exports/users.csv"
 * Example #2: When I download the file from the URL "https://example.com/doc.pdf"
 * Example #3: And we download the file from the URL "/api/report?format=pdf"
 * Example #4: When I download the file from the URL "/files/logo.svg"
 * Example #5: When I download the file from the URL "/exports/data-2026.json"
 *
 */
When(/^(I |we )*download the file from the URL "([^"]*)"$/, async function (pronoun, url) {
  const target = url.startsWith('http') ? url : (this.launchUrl || '') + url;
  const resp = await this.page.request.get(target);
  assert.strictEqual(resp.status(), 200, `Download failed with status ${resp.status()}.`);
  const buffer = await resp.body();
  const cd = resp.headers()['content-disposition'] || '';
  const m = /filename="?([^"]+)"?/.exec(cd);
  const filename = m ? m[1] : path.basename(new URL(target).pathname) || 'download';
  const filePath = path.join(tmpDownloadDir(), filename);
  fs.writeFileSync(filePath, buffer);
  this._lastDownload = { path: filePath, filename, content: buffer };
});

/**
 * Click a link by visible text and capture the resulting download.
 *
 * Example #1: When I download the file from the link "Download report"
 * Example #2: When I download the file from the link "Export CSV"
 * Example #3: And we download the file from the link "Get logo"
 * Example #4: When I download the file from the link "Download archive"
 * Example #5: When I download the file from the link "Export JSON"
 *
 */
When(/^(I |we )*download the file from the link "([^"]*)"$/, async function (pronoun, linkText) {
  const [download] = await Promise.all([
    this.page.waitForEvent('download'),
    this.page.getByRole('link', { name: linkText }).first().click().catch(() =>
      this.page.locator(`a:has-text("${linkText}")`).first().click()
    ),
  ]);
  const filename = download.suggestedFilename();
  const filePath = path.join(tmpDownloadDir(), filename);
  await download.saveAs(filePath);
  const content = fs.readFileSync(filePath);
  this._lastDownload = { path: filePath, filename, content };
});

/**
 * Assert the most recent download's body contains an expected substring.
 *
 * Body is decoded as UTF-8.
 *
 * Example #1: Then the downloaded file should contain:
 *               """
 *               Order #1234
 *               """
 * Example #2: Then the downloaded file should contain:
 *               """
 *               name,email
 *               """
 * Example #3: And the downloaded file should contain:
 *               """
 *               <svg
 *               """
 * Example #4: Then the downloaded file should contain:
 *               """
 *               "version": "1.0"
 *               """
 * Example #5: Then the downloaded file should contain:
 *               """
 *               %PDF-
 *               """
 *
 */
Then('the downloaded file should contain:', async function (docString) {
  assert.ok(this._lastDownload, 'No download has been performed.');
  const text = this._lastDownload.content.toString('utf-8');
  assert.ok(text.indexOf(docString) !== -1, `Downloaded file does not contain expected text.`);
});

/**
 * Assert the most recent download's filename equals an expected value.
 *
 * Example #1: Then the downloaded file name should be "report.pdf"
 * Example #2: Then the downloaded file name should be "users.csv"
 * Example #3: And the downloaded file name should be "logo.svg"
 * Example #4: Then the downloaded file name should be "archive.zip"
 * Example #5: Then the downloaded file name should be "data-2026.json"
 *
 */
Then('the downloaded file name should be {string}', async function (name) {
  assert.ok(this._lastDownload, 'No download has been performed.');
  assert.strictEqual(this._lastDownload.filename, name);
});

/**
 * Assert the most recent download's filename contains a substring.
 *
 * Useful when filenames embed timestamps or hashes.
 *
 * Example #1: Then the downloaded file name should contain "report"
 * Example #2: Then the downloaded file name should contain ".pdf"
 * Example #3: And the downloaded file name should contain "2026"
 * Example #4: Then the downloaded file name should contain "users"
 * Example #5: Then the downloaded file name should contain "export"
 *
 */
Then('the downloaded file name should contain {string}', async function (part) {
  assert.ok(this._lastDownload, 'No download has been performed.');
  assert.ok(this._lastDownload.filename.indexOf(part) !== -1, `Filename "${this._lastDownload.filename}" does not contain "${part}".`);
});

// ZIP archive assertions: pending. Install `yauzl` or `adm-zip` to enable.

/**
 * (Pending) Assert the downloaded ZIP archive contains the listed filenames exactly.
 *
 * Example #1: Then the downloaded file should be a zip archive containing the following files named:
 *               | report.pdf  |
 *               | summary.csv |
 * Example #2: Then the downloaded file should be a zip archive containing the following files named:
 *               | a.txt | b.txt |
 * Example #3: Then the downloaded file should be a zip archive containing the following files named:
 *               | data.json |
 * Example #4: Then the downloaded file should be a zip archive containing the following files named:
 *               | logo.svg | favicon.ico |
 * Example #5: Then the downloaded file should be a zip archive containing the following files named:
 *               | manifest.json |
 *
 */
Then('the downloaded file should be a zip archive containing the following files named:', async function () {
  return 'pending';
});

/**
 * (Pending) Assert the downloaded ZIP contains files whose names contain the listed substrings.
 *
 * Example #1: Then the downloaded file should be a zip archive containing the following files partially named:
 *               | report |
 *               | csv    |
 * Example #2: Then the downloaded file should be a zip archive containing the following files partially named:
 *               | 2026 |
 * Example #3: Then the downloaded file should be a zip archive containing the following files partially named:
 *               | json |
 * Example #4: Then the downloaded file should be a zip archive containing the following files partially named:
 *               | logo | favicon |
 * Example #5: Then the downloaded file should be a zip archive containing the following files partially named:
 *               | manifest |
 *
 */
Then('the downloaded file should be a zip archive containing the following files partially named:', async function () {
  return 'pending';
});

/**
 * (Pending) Assert the downloaded ZIP does NOT contain files whose names contain the listed substrings.
 *
 * Example #1: Then the downloaded file should be a zip archive not containing the following files partially named:
 *               | secret |
 *               | .env   |
 * Example #2: Then the downloaded file should be a zip archive not containing the following files partially named:
 *               | private |
 * Example #3: Then the downloaded file should be a zip archive not containing the following files partially named:
 *               | tmp |
 * Example #4: Then the downloaded file should be a zip archive not containing the following files partially named:
 *               | DS_Store |
 * Example #5: Then the downloaded file should be a zip archive not containing the following files partially named:
 *               | __MACOSX |
 *
 */
Then('the downloaded file should be a zip archive not containing the following files partially named:', async function () {
  return 'pending';
});
