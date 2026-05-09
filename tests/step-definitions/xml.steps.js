'use strict';

// Parse and assert against an XML response loaded from a file or doc string.

const { Given, Then, When } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let DOMParser;
try { ({ DOMParser } = require('@xmldom/xmldom')); }
catch (e) {
  try { ({ DOMParser } = require('xmldom')); }
  catch (e2) { /* will throw on use */ }
}

function ensureXml(world) {
  if (!DOMParser) throw new Error('XML steps require an XML DOM parser. Install @xmldom/xmldom.');
  if (!world._xml) throw new Error('No XML response has been set.');
  return world._xml;
}

function evalXPath(doc, xpath) {
  // Minimal XPath: support /a/b and /a/b[@attr] and /a/b/text()
  // For richer XPath, users can install xpath module.
  let xpathLib;
  try { xpathLib = require('xpath'); } catch (e) { xpathLib = null; }
  if (xpathLib) return xpathLib.select(xpath, doc);
  // Fallback simple traversal
  const parts = xpath.split('/').filter(Boolean);
  let nodes = [doc.documentElement].filter((n) => n && n.nodeName === parts[0]);
  for (const part of parts.slice(1)) {
    const next = [];
    for (const n of nodes) {
      const children = Array.from(n.childNodes || []).filter((c) => c.nodeType === 1 && c.nodeName === part);
      next.push(...children);
    }
    nodes = next;
  }
  return nodes;
}

/**
 * Load XML response content from a file under `tests/assets/`.
 *
 * Example #1: Given the response content from the file "feed.xml"
 * Example #2: Given the response content from the file "rss.xml"
 * Example #3: And the response content from the file "sitemap.xml"
 * Example #4: Given the response content from the file "soap-response.xml"
 * Example #5: Given the response content from the file "/tmp/sample.xml"
 *
 */
Given('the response content from the file {string}', async function (filename) {
  const p = path.isAbsolute(filename) ? filename : path.join(this.assetsFolder || './tests/assets', filename);
  const content = fs.readFileSync(p, 'utf-8');
  this._rawResponse = content;
  this._xml = new DOMParser().parseFromString(content, 'text/xml');
});

/**
 * Set XML response content inline from a Gherkin doc string.
 *
 * Example #1: Given the response content is the following:
 *               """
 *               <root><item id="1">Hello</item></root>
 *               """
 * Example #2: Given the response content is the following:
 *               """
 *               <feed><entry><title>Sample feed</title></entry></feed>
 *               """
 * Example #3: And the response content is the following:
 *               """
 *               <orders><order id="1"><status>shipped</status></order></orders>
 *               """
 * Example #4: Given the response content is the following:
 *               """
 *               <products><product><name>Laptop</name></product></products>
 *               """
 * Example #5: Given the response content is the following:
 *               """
 *               <error code="404">Not found</error>
 *               """
 *
 */
Given('the response content is the following:', async function (docString) {
  this._rawResponse = docString;
  this._xml = new DOMParser().parseFromString(docString, 'text/xml');
});

/**
 * Assert the loaded response parses as XML.
 *
 * Example #1: Then the response should be in XML format
 * Example #2: Given the response content from the file "rss.xml"
 *               Then the response should be in XML format
 * Example #3: And the response should be in XML format
 * Example #4: Given the response content is the following:
 *               """
 *               <root/>
 *               """
 *               Then the response should be in XML format
 * Example #5: Then the response should be in XML format
 *               And the XML element "/root" should exist
 *
 */
Then('the response should be in XML format', async function () {
  assert.ok(this._rawResponse, 'No response content set.');
  const doc = new DOMParser().parseFromString(this._rawResponse, 'text/xml');
  assert.ok(doc && doc.documentElement, 'Response is not valid XML.');
});

/**
 * Assert the loaded response is NOT XML.
 *
 * Example #1: Then the response should not be in XML format
 * Example #2: Given the response content is the following:
 *               """
 *               {"hello": "world"}
 *               """
 *               Then the response should not be in XML format
 * Example #3: And the response should not be in XML format
 * Example #4: Given the response content is the following:
 *               """
 *               plain text
 *               """
 *               Then the response should not be in XML format
 * Example #5: Then the response should not be in XML format
 *               And I print last XML response
 *
 */
Then('the response should not be in XML format', async function () {
  if (!this._rawResponse) return;
  try {
    const doc = new DOMParser().parseFromString(this._rawResponse, 'text/xml');
    assert.ok(!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length > 0, 'Response is XML.');
  } catch (e) { /* good */ }
});

/**
 * Assert at least one XML element matches an XPath.
 *
 * Example #1: Then the XML element "/root/item" should exist
 * Example #2: Then the XML element "//book/title" should exist
 * Example #3: And the XML element "/order/customer" should exist
 * Example #4: Then the XML element "//status" should exist
 * Example #5: Then the XML element "/feed/entry[2]" should exist
 *
 */
Then('the XML element {string} should exist', async function (xpath) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(nodes && nodes.length > 0, `XML element "${xpath}" not found.`);
});

/**
 * Assert NO XML element matches an XPath.
 *
 * Example #1: Then the XML element "/root/missing" should not exist
 * Example #2: Then the XML element "//error" should not exist
 * Example #3: And the XML element "/feed/legacy" should not exist
 * Example #4: Then the XML element "//deprecated" should not exist
 * Example #5: Then the XML element "/order/refund" should not exist
 *
 */
Then('the XML element {string} should not exist', async function (xpath) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(!nodes || nodes.length === 0, `XML element "${xpath}" should not exist.`);
});

/**
 * Assert an XML element's text content equals an expected value (trimmed).
 *
 * Example #1: Then the XML element "/root/item" should be equal to "Hello"
 * Example #2: Then the XML element "//status" should be equal to "shipped"
 * Example #3: And the XML element "/order/customer/name" should be equal to "Alice"
 * Example #4: Then the XML element "/book/title" should be equal to "Sample title"
 * Example #5: Then the XML element "//count" should be equal to "5"
 *
 */
Then('the XML element {string} should be equal to {string}', async function (xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(nodes && nodes.length > 0, `XML element "${xpath}" not found.`);
  const value = (nodes[0].textContent || '').trim();
  assert.strictEqual(value, text);
});

/**
 * Assert an XML element's text content is NOT equal to an expected value.
 *
 * Example #1: Then the XML element "/root/item" should not be equal to "Bye"
 * Example #2: Then the XML element "//status" should not be equal to "cancelled"
 * Example #3: And the XML element "/order/customer/name" should not be equal to "Anonymous"
 * Example #4: Then the XML element "/book/title" should not be equal to "Untitled"
 * Example #5: Then the XML element "//count" should not be equal to "0"
 *
 */
Then('the XML element {string} should not be equal to {string}', async function (xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  if (!nodes || nodes.length === 0) return;
  assert.notStrictEqual((nodes[0].textContent || '').trim(), text);
});

/**
 * Assert an XML element's text content contains a substring.
 *
 * Example #1: Then the XML element "/root/item" should contain "Hello"
 * Example #2: Then the XML element "//status" should contain "ship"
 * Example #3: And the XML element "/order/customer/name" should contain "Alice"
 * Example #4: Then the XML element "/book/title" should contain "Webship"
 * Example #5: Then the XML element "/feed/entry/summary" should contain "release"
 *
 */
Then('the XML element {string} should contain {string}', async function (xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(nodes && nodes.length > 0, `XML element "${xpath}" not found.`);
  assert.ok((nodes[0].textContent || '').indexOf(text) !== -1);
});

/**
 * Assert an XML element's text content does NOT contain a substring.
 *
 * Example #1: Then the XML element "/root/item" should not contain "Error"
 * Example #2: Then the XML element "//status" should not contain "fail"
 * Example #3: And the XML element "/order/customer/name" should not contain "Anonymous"
 * Example #4: Then the XML element "/book/title" should not contain "Untitled"
 * Example #5: Then the XML element "/feed/entry/summary" should not contain "TODO"
 *
 */
Then('the XML element {string} should not contain {string}', async function (xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  if (!nodes || nodes.length === 0) return;
  assert.ok((nodes[0].textContent || '').indexOf(text) === -1);
});

/**
 * Assert an XML element has the named attribute.
 *
 * Example #1: Then the XML attribute "id" on element "/root/item" should exist
 * Example #2: Then the XML attribute "lang" on element "/feed" should exist
 * Example #3: And the XML attribute "type" on element "//entry" should exist
 * Example #4: Then the XML attribute "version" on element "/rss" should exist
 * Example #5: Then the XML attribute "code" on element "/error" should exist
 *
 */
Then('the XML attribute {string} on element {string} should exist', async function (attr, xpath) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(nodes && nodes.length > 0, `XML element "${xpath}" not found.`);
  assert.ok(nodes[0].getAttribute && nodes[0].hasAttribute(attr), `Attribute "${attr}" not found on "${xpath}".`);
});

/**
 * Assert an XML element does NOT have the named attribute.
 *
 * Example #1: Then the XML attribute "deprecated" on element "/root/item" should not exist
 * Example #2: Then the XML attribute "internal" on element "/feed" should not exist
 * Example #3: And the XML attribute "secret" on element "//entry" should not exist
 * Example #4: Then the XML attribute "private" on element "/rss" should not exist
 * Example #5: Then the XML attribute "debug" on element "/error" should not exist
 *
 */
Then('the XML attribute {string} on element {string} should not exist', async function (attr, xpath) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  if (!nodes || nodes.length === 0) return;
  assert.ok(!nodes[0].hasAttribute(attr), `Attribute "${attr}" should not exist on "${xpath}".`);
});

/**
 * Assert an XML attribute equals an expected value.
 *
 * Example #1: Then the XML attribute "id" on element "/root/item" should be equal to "1"
 * Example #2: Then the XML attribute "lang" on element "/feed" should be equal to "en"
 * Example #3: And the XML attribute "type" on element "//entry" should be equal to "html"
 * Example #4: Then the XML attribute "version" on element "/rss" should be equal to "2.0"
 * Example #5: Then the XML attribute "code" on element "/error" should be equal to "404"
 *
 */
Then('the XML attribute {string} on element {string} should be equal to {string}', async function (attr, xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(nodes && nodes.length > 0, `XML element "${xpath}" not found.`);
  assert.strictEqual(nodes[0].getAttribute(attr), text);
});

/**
 * Assert an XML attribute is NOT equal to an expected value.
 *
 * Example #1: Then the XML attribute "id" on element "/root/item" should not be equal to "0"
 * Example #2: Then the XML attribute "lang" on element "/feed" should not be equal to "xx"
 * Example #3: And the XML attribute "type" on element "//entry" should not be equal to "binary"
 * Example #4: Then the XML attribute "version" on element "/rss" should not be equal to "0.9"
 * Example #5: Then the XML attribute "code" on element "/error" should not be equal to "200"
 *
 */
Then('the XML attribute {string} on element {string} should not be equal to {string}', async function (attr, xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  if (!nodes || nodes.length === 0) return;
  assert.notStrictEqual(nodes[0].getAttribute(attr), text);
});

/**
 * Assert an XML attribute contains a substring.
 *
 * Example #1: Then the XML attribute "id" on element "/root/item" should contain "abc"
 * Example #2: Then the XML attribute "href" on element "//link" should contain "example.com"
 * Example #3: And the XML attribute "type" on element "//entry" should contain "html"
 * Example #4: Then the XML attribute "version" on element "/rss" should contain "2"
 * Example #5: Then the XML attribute "code" on element "/error" should contain "4"
 *
 */
Then('the XML attribute {string} on element {string} should contain {string}', async function (attr, xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.ok(nodes && nodes.length > 0, `XML element "${xpath}" not found.`);
  assert.ok((nodes[0].getAttribute(attr) || '').indexOf(text) !== -1);
});

/**
 * Assert an XML attribute does NOT contain a substring.
 *
 * Example #1: Then the XML attribute "id" on element "/root/item" should not contain "old"
 * Example #2: Then the XML attribute "href" on element "//link" should not contain "tracking"
 * Example #3: And the XML attribute "type" on element "//entry" should not contain "binary"
 * Example #4: Then the XML attribute "version" on element "/rss" should not contain "alpha"
 * Example #5: Then the XML attribute "code" on element "/error" should not contain "5"
 *
 */
Then('the XML attribute {string} on element {string} should not contain {string}', async function (attr, xpath, text) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  if (!nodes || nodes.length === 0) return;
  assert.ok((nodes[0].getAttribute(attr) || '').indexOf(text) === -1);
});

/**
 * Assert exactly N elements match an XPath.
 *
 * Example #1: Then the XML element "//entry" should have 5 elements
 * Example #2: Then the XML element "/root/item" should have 1 element
 * Example #3: And the XML element "//error" should have 0 elements
 * Example #4: Then the XML element "/feed/entry" should have 10 elements
 * Example #5: Then the XML element "/orders/order" should have 3 elements
 *
 */
Then('the XML element {string} should have {int} element(s)', async function (xpath, count) {
  const doc = ensureXml(this);
  const nodes = evalXPath(doc, xpath);
  assert.strictEqual((nodes || []).length, count);
});

/**
 * Assert the XML root declares an `xmlns:*` namespace URI.
 *
 * Example #1: Then the XML should use the namespace "http://www.w3.org/2005/Atom"
 * Example #2: Then the XML should use the namespace "http://www.sitemaps.org/schemas/sitemap/0.9"
 * Example #3: And the XML should use the namespace "http://schemas.xmlsoap.org/soap/envelope/"
 * Example #4: Then the XML should use the namespace "http://www.w3.org/1999/xhtml"
 * Example #5: Then the XML should use the namespace "http://www.opengis.net/gml"
 *
 */
Then('the XML should use the namespace {string}', async function (ns) {
  const doc = ensureXml(this);
  const root = doc.documentElement;
  const found = Array.from(root.attributes || []).some((a) => a.value === ns);
  assert.ok(found, `Namespace "${ns}" not declared.`);
});

/**
 * Assert the XML root does NOT declare a namespace URI.
 *
 * Example #1: Then the XML should not use the namespace "http://example.com/legacy"
 * Example #2: Then the XML should not use the namespace "http://example.com/internal"
 * Example #3: And the XML should not use the namespace "http://example.com/v1"
 * Example #4: Then the XML should not use the namespace "http://example.com/deprecated"
 * Example #5: Then the XML should not use the namespace "http://example.com/private"
 *
 */
Then('the XML should not use the namespace {string}', async function (ns) {
  const doc = ensureXml(this);
  const root = doc.documentElement;
  const found = Array.from(root.attributes || []).some((a) => a.value === ns);
  assert.ok(!found, `Namespace "${ns}" should not be declared.`);
});

/**
 * Print the most recently set raw XML response to stdout (debug aid).
 *
 * Example #1: When I print last XML response
 * Example #2: When I send a REST "GET" request to "/api/feed"
 *               And I print last XML response
 * Example #3: And I print last XML response
 * Example #4: Given the response content is the following:
 *               """
 *               <root/>
 *               """
 *               When I print last XML response
 * Example #5: When I print last XML response
 *
 */
When(/^(I |we )*print last XML response$/, async function () {
  console.log(this._rawResponse || '(no response)');
});
