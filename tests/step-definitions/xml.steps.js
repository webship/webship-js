'use strict';

const { friendly, resolveAssetFile } = require('./webship');

// Parse and assert against an XML response loaded from a file or doc string.
//
// The XPath of a step reads like the XML does: a prefixed name such as
// //dc:creator resolves against the xmlns:dc="..." declarations of the
// document, and a name without a prefix such as /urlset/url also matches an
// element of the default namespace (xmlns="..."), as in a sitemap or a feed.

const { Given, Then, When } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');

let DOMParser;
try { ({ DOMParser } = require('@xmldom/xmldom')); }
catch (e) {
  try { ({ DOMParser } = require('xmldom')); }
  catch (e2) { /* will throw on use */ }
}

function requireParser() {
  if (!DOMParser) throw friendly('XML steps require an XML DOM parser. Install @xmldom/xmldom.');
}

function ensureXml(world) {
  requireParser();
  if (world._xmlParseError) throw friendly(`The response is not valid XML: ${world._xmlParseError}`);
  if (!world._xml) throw friendly('No XML response has been set.');
  return world._xml;
}

// Parse without throwing and without printing: returns the document, or the
// reason the content is not well-formed XML.
function parseXml(content) {
  requireParser();
  const problems = [];
  let doc = null;
  try {
    doc = new DOMParser({
      onError: (level, message) => { if (level !== 'warning') problems.push(String(message).trim()); },
    }).parseFromString(String(content), 'text/xml');
  } catch (e) {
    if (problems.length === 0) problems.push(e.message);
  }
  if (problems.length === 0 && (!doc || !doc.documentElement)) problems.push('missing root element');
  return problems.length ? { doc: null, error: problems[0] } : { doc, error: null };
}

// Keep the raw content even when it is not XML, so that the two format steps
// ("should be" / "should not be in XML format") can judge it.
function setXmlResponse(world, content) {
  const { doc, error } = parseXml(content);
  world._rawResponse = content;
  world._xml = doc;
  world._xmlParseError = error;
}

// Every prefix the document declares (xmlns:dc="..."), wherever it is declared.
function declaredNamespaces(doc) {
  const map = {};
  const walk = (el) => {
    for (const a of Array.from(el.attributes || [])) {
      if (a.name.indexOf('xmlns:') === 0 && !(a.name.slice(6) in map)) map[a.name.slice(6)] = a.value;
    }
    for (const c of Array.from(el.childNodes || [])) if (c.nodeType === 1) walk(c);
  };
  if (doc && doc.documentElement) walk(doc.documentElement);
  return map;
}

function evalXPath(doc, xpath) {
  // Minimal XPath: support /a/b and /a/b[@attr] and /a/b/text()
  // For richer XPath, users can install xpath module.
  let xpathLib;
  try { xpathLib = require('xpath'); } catch (e) { xpathLib = null; }
  if (xpathLib) {
    // The XPath reads like the XML does: a prefixed name (//dc:creator)
    // resolves against the prefixes the document itself declares, and a name
    // without a prefix (/urlset/url) also matches an element of the default
    // namespace (xmlns="..."), which every sitemap and Atom feed declares.
    try {
      return xpathLib.parse(xpath).select({
        node: doc,
        namespaces: declaredNamespaces(doc),
        allowAnyNamespaceForNoPrefix: true,
      });
    } catch (e) {
      throw friendly({
        action: `evaluate the XPath "${xpath}"`,
        cause: e,
        hint: 'check the XPath syntax; a prefix (dc:creator) must be declared in the XML with xmlns:dc="...".',
      });
    }
  }
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
 * Load XML response content from a file under `tests/assets/` of the project,
 * or from a path from the project root.
 *
 * Example #1: Given the response content from the file "feed.xml"
 * Example #2: Given the response content from the file "rss.xml"
 * Example #3: And the response content from the file "sitemap.xml"
 * Example #4: Given the response content from the file "soap-response.xml"
 * Example #5: Given the response content from the file "/tmp/sample.xml"
 *
 */
Given('the response content from the file {string}', async function (filename) {
  setXmlResponse(this, fs.readFileSync(resolveAssetFile(this, filename), 'utf-8'));
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
  setXmlResponse(this, docString);
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
  const { error } = parseXml(this._rawResponse);
  assert.ok(!error, `Response is not valid XML: ${error}`);
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
  assert.ok(this._rawResponse, 'No response content set.');
  const { error } = parseXml(this._rawResponse);
  assert.ok(error, 'Response is valid XML.');
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

// Every namespace an XML document uses: each one an element declares
// (xmlns="..." or xmlns:p="..."), wherever it is declared, and the namespace
// of every element and attribute. Other attributes are values, not namespaces.
function usedNamespaces(doc) {
  const found = new Set();
  const walk = (el) => {
    if (el.namespaceURI) found.add(el.namespaceURI);
    for (const a of Array.from(el.attributes || [])) {
      if (a.name === 'xmlns' || a.name.indexOf('xmlns:') === 0) {
        if (a.value) found.add(a.value);
      } else if (a.namespaceURI) {
        found.add(a.namespaceURI);
      }
    }
    for (const c of Array.from(el.childNodes || [])) if (c.nodeType === 1) walk(c);
  };
  if (doc && doc.documentElement) walk(doc.documentElement);
  return found;
}

function listNamespaces(found) {
  return found.size ? Array.from(found).map((ns) => `"${ns}"`).join(', ') : 'no namespace';
}

/**
 * Assert the XML document uses a namespace: an element declares it
 * (`xmlns="..."` or `xmlns:p="..."`) anywhere in the document, or an element
 * or an attribute is in it.
 *
 * Example #1: Then the XML should use the namespace "http://www.w3.org/2005/Atom"
 * Example #2: Then the XML should use the namespace "http://www.sitemaps.org/schemas/sitemap/0.9"
 * Example #3: And the XML should use the namespace "http://schemas.xmlsoap.org/soap/envelope/"
 * Example #4: Then the XML should use the namespace "http://www.w3.org/1999/xhtml"
 * Example #5: Then the XML should use the namespace "http://www.opengis.net/gml"
 *
 */
Then('the XML should use the namespace {string}', async function (ns) {
  const found = usedNamespaces(ensureXml(this));
  if (!found.has(ns)) {
    throw friendly(
      `The XML does not use the namespace "${ns}".\n` +
      `  Found: ${listNamespaces(found)}\n` +
      '  Hint: the step reads every xmlns declaration of the document, and the namespace of every element and attribute; the URI must match exactly.'
    );
  }
});

/**
 * Assert the XML document does NOT use a namespace: no element declares it
 * and no element or attribute is in it.
 *
 * Example #1: Then the XML should not use the namespace "http://example.com/legacy"
 * Example #2: Then the XML should not use the namespace "http://example.com/internal"
 * Example #3: And the XML should not use the namespace "http://example.com/v1"
 * Example #4: Then the XML should not use the namespace "http://example.com/deprecated"
 * Example #5: Then the XML should not use the namespace "http://example.com/private"
 *
 */
Then('the XML should not use the namespace {string}', async function (ns) {
  const found = usedNamespaces(ensureXml(this));
  if (found.has(ns)) {
    throw friendly(
      `The XML uses the namespace "${ns}", but it should not.\n` +
      `  Found: ${listNamespaces(found)}\n` +
      '  Hint: the step reads every xmlns declaration of the document, and the namespace of every element and attribute.'
    );
  }
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
When(/^(I |we )*print last XML response$/, async function (pronounCase) {
  console.log(this._rawResponse || '(no response)');
});
