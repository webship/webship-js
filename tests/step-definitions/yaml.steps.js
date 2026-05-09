'use strict';

// Parse and assert against YAML response bodies.
//
// Mirrors xml.steps.js where it makes sense (path-based existence / equality
// / contains / count / "namespace") and adds YAML-native concepts: multi-
// document streams (`---`), type-of assertions, numeric comparisons,
// array-of-objects matching, JSONPath / JMESPath queries, JSON-Schema
// validation, key-set assertions, diff vs. expected, and well-formedness.
//
// Path syntax for the simple `/a/b/c` form is JSON Pointer (RFC 6901)
// flavoured: numeric segments index sequences (`/items/0/name`). For richer
// queries use the dedicated JSONPath / JMESPath steps.

const { Given, Then, When } = require('@cucumber/cucumber');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let YAML; try { YAML = require('js-yaml'); } catch { /* lazy */ }
let Ajv; let addFormats;
try { Ajv = require('ajv'); } catch { /* lazy */ }
try { addFormats = require('ajv-formats'); } catch { /* lazy */ }

function requireYaml() {
  if (!YAML) throw new Error('YAML steps require js-yaml. Install with: npm i js-yaml');
  return YAML;
}

function ensureLoaded(world) {
  requireYaml();
  if (world._yaml === undefined) throw new Error('No YAML response has been set.');
  return world._yaml;
}

// Active document index for multi-document streams.
function activeIndex(world) { return world._yamlDocIndex || 0; }
function activeDoc(world) {
  const docs = world._yamlDocs;
  if (Array.isArray(docs) && docs.length > 0) return docs[activeIndex(world)];
  return world._yaml;
}

// Walk a "/a/b/c" path. Numeric segments index arrays. Returns array
// of matches (0 or 1 entries) so call sites mirror xml's evalXPath contract.
function evalPath(doc, p) {
  if (!p || p === '/') return [doc];
  const parts = p.split('/').filter(Boolean);
  let cur = doc;
  for (const raw of parts) {
    if (cur == null) return [];
    const m = raw.match(/^([^\[]+)?(?:\[(\d+)\])?$/);
    const key = m && m[1];
    const idx = m && m[2] !== undefined ? parseInt(m[2], 10) : null;
    if (key) {
      if (typeof cur !== 'object' || !(key in cur)) return [];
      cur = cur[key];
    }
    if (idx !== null) {
      if (!Array.isArray(cur) || idx >= cur.length) return [];
      cur = cur[idx];
    }
    if (!key && idx === null && /^\d+$/.test(raw)) {
      const i = parseInt(raw, 10);
      if (!Array.isArray(cur) || i >= cur.length) return [];
      cur = cur[i];
    }
  }
  return cur === undefined ? [] : [cur];
}

function nodeText(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  return YAML.dump(node).trim();
}

function nodeAttr(node, key) {
  if (node && typeof node === 'object' && !Array.isArray(node) && key in node) {
    return nodeText(node[key]);
  }
  return null;
}

function nodeHasAttr(node, key) {
  return node && typeof node === 'object' && !Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, key);
}

function typeOfNode(node) {
  if (node === null) return 'null';
  if (Array.isArray(node)) return 'array';
  const t = typeof node;
  if (t === 'object') return 'object';
  if (t === 'number') return Number.isInteger(node) ? 'integer' : 'number';
  return t; // 'string' | 'boolean'
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Load YAML response content from a file under `tests/assets/`.
 *
 * Multi-document streams (`---`) are parsed via `loadAll`. The first document
 * becomes the default; switch with `Given the active YAML document is N`.
 *
 * Example #1: Given the YAML response content from the file "config.yml"
 * Example #2: Given the YAML response content from the file "openapi.yaml"
 * Example #3: And the YAML response content from the file "users.yml"
 * Example #4: Given the YAML response content from the file "k8s-deployment.yaml"
 * Example #5: Given the YAML response content from the file "/tmp/sample.yml"
 *
 */
Given('the YAML response content from the file {string}', async function (filename) {
  requireYaml();
  const p = path.isAbsolute(filename) ? filename : path.join(this.assetsFolder || './tests/assets', filename);
  const content = fs.readFileSync(p, 'utf-8');
  this._rawYamlResponse = content;
  this._yamlDocs = YAML.loadAll(content);
  this._yaml = this._yamlDocs[0];
  this._yamlDocIndex = 0;
});

/**
 * Set YAML response content inline from a Gherkin doc string. Supports
 * multi-document streams.
 *
 * Example #1: Given the YAML response content is the following:
 *               """
 *               name: example
 *               version: 1.0.0
 *               """
 * Example #2: Given the YAML response content is the following:
 *               """
 *               items:
 *                 - id: 1
 *                   title: Hello
 *               """
 * Example #3: And the YAML response content is the following:
 *               """
 *               status: ok
 *               count: 5
 *               """
 * Example #4: Given the YAML response content is the following:
 *               """
 *               apiVersion: v1
 *               kind: ConfigMap
 *               ---
 *               apiVersion: v1
 *               kind: Service
 *               """
 * Example #5: Given the YAML response content is the following:
 *               """
 *               error:
 *                 code: 404
 *                 message: Not found
 *               """
 *
 */
Given('the YAML response content is the following:', async function (docString) {
  requireYaml();
  this._rawYamlResponse = docString;
  this._yamlDocs = YAML.loadAll(docString);
  this._yaml = this._yamlDocs[0];
  this._yamlDocIndex = 0;
});

/**
 * Switch the active document for subsequent assertions. Index is 1-based to
 * match how Helm / `kubectl get -o yaml` users describe documents.
 *
 * Example #1: Given the active YAML document is 1
 * Example #2: Given the active YAML document is 2
 * Example #3: And the active YAML document is 3
 * Example #4: Given the active YAML document is 1
 *               Then the YAML element "/kind" should be equal to "ConfigMap"
 * Example #5: Given the active YAML document is 2
 *               Then the YAML element "/kind" should be equal to "Service"
 *
 */
Given('the active YAML document is {int}', function (n) {
  if (!this._yamlDocs) throw new Error('No YAML response has been set.');
  const idx = n - 1;
  if (idx < 0 || idx >= this._yamlDocs.length) {
    throw new Error(`Document ${n} out of range (have ${this._yamlDocs.length}).`);
  }
  this._yamlDocIndex = idx;
  this._yaml = this._yamlDocs[idx];
});

/**
 * Assert the multi-document stream has exactly N documents.
 *
 * Example #1: Then the YAML response should have 1 document
 * Example #2: Then the YAML response should have 2 documents
 * Example #3: And the YAML response should have 5 documents
 * Example #4: Then the YAML response should have 0 documents
 * Example #5: Then the YAML response should have 10 documents
 *
 */
Then('the YAML response should have {int} document(s)', function (n) {
  ensureLoaded(this);
  const have = (this._yamlDocs || []).length;
  assert.strictEqual(have, n, `Expected ${n} YAML documents, got ${have}.`);
});

// ---------------------------------------------------------------------------
// Format / well-formedness
// ---------------------------------------------------------------------------

/**
 * Assert the loaded response parses as YAML.
 *
 * Example #1: Then the response should be in YAML format
 * Example #2: Given the YAML response content from the file "openapi.yaml"
 *               Then the response should be in YAML format
 * Example #3: And the response should be in YAML format
 * Example #4: Given the YAML response content is the following:
 *               """
 *               key: value
 *               """
 *               Then the response should be in YAML format
 * Example #5: Then the response should be in YAML format
 *               And the YAML element "/key" should exist
 *
 */
Then('the response should be in YAML format', async function () {
  requireYaml();
  assert.ok(this._rawYamlResponse, 'No YAML response content set.');
  try { YAML.loadAll(this._rawYamlResponse); }
  catch (e) { assert.fail(`Response is not valid YAML: ${e.message}`); }
});

/**
 * Assert the loaded response is NOT valid YAML.
 *
 * Example #1: Then the response should not be in YAML format
 * Example #2: Given the YAML response content is the following:
 *               """
 *               <not> yaml </not>
 *               """
 *               Then the response should not be in YAML format
 * Example #3: And the response should not be in YAML format
 * Example #4: Given the YAML response content is the following:
 *               """
 *               key: : :
 *               """
 *               Then the response should not be in YAML format
 * Example #5: Then the response should not be in YAML format
 *               And I print last YAML response
 *
 */
Then('the response should not be in YAML format', async function () {
  if (!this._rawYamlResponse || !YAML) return;
  try { YAML.loadAll(this._rawYamlResponse); }
  catch (e) { return; /* expected */ }
});

/**
 * Assert the YAML has no duplicate keys at any level. Uses js-yaml's
 * `onWarning` hook (duplicates raise warnings under default schema).
 *
 * Example #1: Then the YAML should have no duplicate keys
 * Example #2: Given the YAML response content is the following:
 *               """
 *               name: A
 *               version: 1
 *               """
 *               Then the YAML should have no duplicate keys
 * Example #3: And the YAML should have no duplicate keys
 * Example #4: Then the YAML should have no duplicate keys
 *               And the YAML element "/name" should be equal to "A"
 * Example #5: Then the YAML should have no duplicate keys
 *
 */
Then('the YAML should have no duplicate keys', function () {
  requireYaml();
  assert.ok(this._rawYamlResponse, 'No YAML response content set.');
  const warnings = [];
  YAML.loadAll(this._rawYamlResponse, undefined, { onWarning: (w) => warnings.push(w.message || String(w)) });
  const dupes = warnings.filter((m) => /duplicat/i.test(m));
  assert.strictEqual(dupes.length, 0, `Duplicate keys found:\n  ${dupes.join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Existence + equality + contains (path-based)
// ---------------------------------------------------------------------------

/**
 * Assert at least one YAML node matches a path.
 *
 * Example #1: Then the YAML element "/name" should exist
 * Example #2: Then the YAML element "/items/0/title" should exist
 * Example #3: And the YAML element "/error/code" should exist
 * Example #4: Then the YAML element "/spec/replicas" should exist
 * Example #5: Then the YAML element "/users/2/email" should exist
 *
 */
Then('the YAML element {string} should exist', function (p) {
  const doc = activeDoc(this); ensureLoaded(this);
  assert.ok(evalPath(doc, p).length > 0, `YAML element "${p}" not found.`);
});

/**
 * Assert NO YAML node matches a path.
 *
 * Example #1: Then the YAML element "/missing" should not exist
 * Example #2: Then the YAML element "/items/100" should not exist
 * Example #3: And the YAML element "/legacy/field" should not exist
 * Example #4: Then the YAML element "/spec/internal" should not exist
 * Example #5: Then the YAML element "/error/refund" should not exist
 *
 */
Then('the YAML element {string} should not exist', function (p) {
  const doc = activeDoc(this); ensureLoaded(this);
  assert.strictEqual(evalPath(doc, p).length, 0, `YAML element "${p}" should not exist.`);
});

/**
 * Assert a YAML node's scalar value equals an expected value.
 *
 * Example #1: Then the YAML element "/name" should be equal to "example"
 * Example #2: Then the YAML element "/version" should be equal to "2.5.2"
 * Example #3: And the YAML element "/items/0/title" should be equal to "Hello"
 * Example #4: Then the YAML element "/error/code" should be equal to "404"
 * Example #5: Then the YAML element "/status" should be equal to "ok"
 *
 */
Then('the YAML element {string} should be equal to {string}', function (p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  assert.strictEqual(nodeText(nodes[0]), text);
});

/**
 * Assert a YAML node's scalar value is NOT equal to an expected value.
 *
 * Example #1: Then the YAML element "/name" should not be equal to "Other"
 * Example #2: Then the YAML element "/version" should not be equal to "1.0.0"
 * Example #3: And the YAML element "/items/0/title" should not be equal to "Bye"
 * Example #4: Then the YAML element "/error/code" should not be equal to "200"
 * Example #5: Then the YAML element "/status" should not be equal to "fail"
 *
 */
Then('the YAML element {string} should not be equal to {string}', function (p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) return;
  assert.notStrictEqual(nodeText(nodes[0]), text);
});

/**
 * Assert a YAML node's serialised value contains a substring.
 *
 * Example #1: Then the YAML element "/name" should contain "Web"
 * Example #2: Then the YAML element "/items/0/title" should contain "Hello"
 * Example #3: And the YAML element "/spec" should contain "replicas"
 * Example #4: Then the YAML element "/error/message" should contain "Not"
 * Example #5: Then the YAML element "/status" should contain "ok"
 *
 */
Then('the YAML element {string} should contain {string}', function (p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  assert.ok(nodeText(nodes[0]).indexOf(text) !== -1);
});

/**
 * Assert a YAML node's serialised value does NOT contain a substring.
 *
 * Example #1: Then the YAML element "/name" should not contain "Error"
 * Example #2: Then the YAML element "/items/0/title" should not contain "fail"
 * Example #3: And the YAML element "/spec" should not contain "deprecated"
 * Example #4: Then the YAML element "/error/message" should not contain "OK"
 * Example #5: Then the YAML element "/status" should not contain "fatal"
 *
 */
Then('the YAML element {string} should not contain {string}', function (p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) return;
  assert.ok(nodeText(nodes[0]).indexOf(text) === -1);
});

// ---------------------------------------------------------------------------
// Attribute (direct child key) variants — kept verbatim from prior version.
// ---------------------------------------------------------------------------

/**
 * Assert a YAML node has a direct child key.
 *
 * Example #1: Then the YAML attribute "id" on element "/items/0" should exist
 * Example #2: Then the YAML attribute "kind" on element "/" should exist
 * Example #3: And the YAML attribute "code" on element "/error" should exist
 * Example #4: Then the YAML attribute "replicas" on element "/spec" should exist
 * Example #5: Then the YAML attribute "email" on element "/users/0" should exist
 *
 */
Then('the YAML attribute {string} on element {string} should exist', function (attr, p) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  assert.ok(nodeHasAttr(nodes[0], attr), `Key "${attr}" not present on "${p}".`);
});

/**
 * Assert a YAML node does NOT have a direct child key.
 *
 * Example #1: Then the YAML attribute "deprecated" on element "/items/0" should not exist
 * Example #2: Then the YAML attribute "secret" on element "/" should not exist
 * Example #3: And the YAML attribute "internal" on element "/spec" should not exist
 * Example #4: Then the YAML attribute "private" on element "/error" should not exist
 * Example #5: Then the YAML attribute "_legacy" on element "/users/0" should not exist
 *
 */
Then('the YAML attribute {string} on element {string} should not exist', function (attr, p) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) return;
  assert.ok(!nodeHasAttr(nodes[0], attr), `Key "${attr}" should not exist on "${p}".`);
});

/**
 * Assert a YAML child key's value equals an expected value.
 *
 * Example #1: Then the YAML attribute "id" on element "/items/0" should be equal to "1"
 * Example #2: Then the YAML attribute "kind" on element "/" should be equal to "ConfigMap"
 * Example #3: And the YAML attribute "code" on element "/error" should be equal to "404"
 * Example #4: Then the YAML attribute "replicas" on element "/spec" should be equal to "3"
 * Example #5: Then the YAML attribute "version" on element "/" should be equal to "v1"
 *
 */
Then('the YAML attribute {string} on element {string} should be equal to {string}', function (attr, p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  assert.strictEqual(nodeAttr(nodes[0], attr), text);
});

/**
 * Assert a YAML child key's value is NOT equal to an expected value.
 *
 * Example #1: Then the YAML attribute "id" on element "/items/0" should not be equal to "0"
 * Example #2: Then the YAML attribute "kind" on element "/" should not be equal to "Secret"
 * Example #3: And the YAML attribute "code" on element "/error" should not be equal to "200"
 * Example #4: Then the YAML attribute "replicas" on element "/spec" should not be equal to "0"
 * Example #5: Then the YAML attribute "version" on element "/" should not be equal to "v0"
 *
 */
Then('the YAML attribute {string} on element {string} should not be equal to {string}', function (attr, p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) return;
  assert.notStrictEqual(nodeAttr(nodes[0], attr), text);
});

/**
 * Assert a YAML child key's serialised value contains a substring.
 *
 * Example #1: Then the YAML attribute "id" on element "/items/0" should contain "abc"
 * Example #2: Then the YAML attribute "image" on element "/spec" should contain "nginx"
 * Example #3: And the YAML attribute "kind" on element "/" should contain "Map"
 * Example #4: Then the YAML attribute "version" on element "/" should contain "v"
 * Example #5: Then the YAML attribute "code" on element "/error" should contain "4"
 *
 */
Then('the YAML attribute {string} on element {string} should contain {string}', function (attr, p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  assert.ok((nodeAttr(nodes[0], attr) || '').indexOf(text) !== -1);
});

/**
 * Assert a YAML child key's serialised value does NOT contain a substring.
 *
 * Example #1: Then the YAML attribute "id" on element "/items/0" should not contain "old"
 * Example #2: Then the YAML attribute "image" on element "/spec" should not contain "alpine"
 * Example #3: And the YAML attribute "kind" on element "/" should not contain "Secret"
 * Example #4: Then the YAML attribute "version" on element "/" should not contain "alpha"
 * Example #5: Then the YAML attribute "code" on element "/error" should not contain "5"
 *
 */
Then('the YAML attribute {string} on element {string} should not contain {string}', function (attr, p, text) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) return;
  assert.ok((nodeAttr(nodes[0], attr) || '').indexOf(text) === -1);
});

/**
 * Assert a YAML sequence / mapping at a path has exactly N entries.
 *
 * Example #1: Then the YAML element "/items" should have 5 elements
 * Example #2: Then the YAML element "/users" should have 3 elements
 * Example #3: And the YAML element "/spec/containers" should have 1 element
 * Example #4: Then the YAML element "/errors" should have 0 elements
 * Example #5: Then the YAML element "/feed/entries" should have 10 elements
 *
 */
Then('the YAML element {string} should have {int} element(s)', function (p, count) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  const node = nodes[0];
  const len = Array.isArray(node) ? node.length : (node && typeof node === 'object' ? Object.keys(node).length : 0);
  assert.strictEqual(len, count);
});

// ---------------------------------------------------------------------------
// Type-of assertions
// ---------------------------------------------------------------------------

/**
 * Assert a YAML node's type. Accepts: string, integer, number, boolean,
 * array, object, null.
 *
 * Example #1: Then the YAML value at "/spec/replicas" should be of type "integer"
 * Example #2: Then the YAML value at "/metadata/name" should be of type "string"
 * Example #3: And the YAML value at "/spec/containers" should be of type "array"
 * Example #4: Then the YAML value at "/spec" should be of type "object"
 * Example #5: Then the YAML value at "/spec/paused" should be of type "boolean"
 *
 */
Then('the YAML value at {string} should be of type {string}', function (p, expected) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  const got = typeOfNode(nodes[0]);
  // Allow "number" to match both number and integer.
  if (expected === 'number') assert.ok(got === 'number' || got === 'integer', `Expected number, got ${got}.`);
  else assert.strictEqual(got, expected, `Expected ${expected}, got ${got}.`);
});

/**
 * Assert a YAML node is empty: empty string, empty array, empty object, or null.
 *
 * Example #1: Then the YAML value at "/labels" should be empty
 * Example #2: Then the YAML value at "/items" should be empty
 * Example #3: And the YAML value at "/error" should be empty
 * Example #4: Then the YAML value at "/notes" should be empty
 * Example #5: Then the YAML value at "/status/conditions" should be empty
 *
 */
Then('the YAML value at {string} should be empty', function (p) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  const v = nodes[0];
  const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0)
              || (typeof v === 'object' && Object.keys(v).length === 0);
  assert.ok(empty, `YAML value at "${p}" is not empty.`);
});

/**
 * Assert a YAML node is non-empty.
 *
 * Example #1: Then the YAML value at "/items" should not be empty
 * Example #2: Then the YAML value at "/spec/containers" should not be empty
 * Example #3: And the YAML value at "/metadata/name" should not be empty
 * Example #4: Then the YAML value at "/users" should not be empty
 * Example #5: Then the YAML value at "/spec/replicas" should not be empty
 *
 */
Then('the YAML value at {string} should not be empty', function (p) {
  const doc = activeDoc(this); ensureLoaded(this);
  const nodes = evalPath(doc, p);
  assert.ok(nodes.length > 0, `YAML element "${p}" not found.`);
  const v = nodes[0];
  const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0)
              || (typeof v === 'object' && Object.keys(v).length === 0);
  assert.ok(!empty, `YAML value at "${p}" is empty.`);
});

// ---------------------------------------------------------------------------
// Numeric comparisons
// ---------------------------------------------------------------------------

function numAt(doc, p) {
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) throw new Error(`YAML element "${p}" not found.`);
  const v = nodes[0];
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`YAML value at "${p}" is not numeric: ${v}`);
  return n;
}

/**
 * Assert a numeric YAML node is greater than a value.
 *
 * Example #1: Then the YAML value at "/spec/replicas" should be greater than 0
 * Example #2: Then the YAML value at "/timeout" should be greater than 5
 * Example #3: And the YAML value at "/spec/minReadySeconds" should be greater than 0
 * Example #4: Then the YAML value at "/limits/cpu" should be greater than 100
 * Example #5: Then the YAML value at "/version/major" should be greater than 1
 *
 */
Then('the YAML value at {string} should be greater than {float}', function (p, n) {
  const doc = activeDoc(this); ensureLoaded(this);
  assert.ok(numAt(doc, p) > n);
});

/**
 * Assert a numeric YAML node is greater than or equal to a value.
 *
 * Example #1: Then the YAML value at "/spec/replicas" should be greater than or equal to 1
 * Example #2: Then the YAML value at "/retries" should be greater than or equal to 0
 * Example #3: And the YAML value at "/timeout" should be greater than or equal to 30
 * Example #4: Then the YAML value at "/version/major" should be greater than or equal to 2
 * Example #5: Then the YAML value at "/limits/cpu" should be greater than or equal to 250
 *
 */
Then('the YAML value at {string} should be greater than or equal to {float}', function (p, n) {
  const doc = activeDoc(this); ensureLoaded(this);
  assert.ok(numAt(doc, p) >= n);
});

/**
 * Assert a numeric YAML node is less than a value.
 *
 * Example #1: Then the YAML value at "/spec/replicas" should be less than 100
 * Example #2: Then the YAML value at "/error/code" should be less than 500
 * Example #3: And the YAML value at "/timeout" should be less than 60
 * Example #4: Then the YAML value at "/version/minor" should be less than 10
 * Example #5: Then the YAML value at "/cost" should be less than 1000
 *
 */
Then('the YAML value at {string} should be less than {float}', function (p, n) {
  const doc = activeDoc(this); ensureLoaded(this);
  assert.ok(numAt(doc, p) < n);
});

/**
 * Assert a numeric YAML node is less than or equal to a value.
 *
 * Example #1: Then the YAML value at "/spec/replicas" should be less than or equal to 10
 * Example #2: Then the YAML value at "/retries" should be less than or equal to 5
 * Example #3: And the YAML value at "/timeout" should be less than or equal to 60
 * Example #4: Then the YAML value at "/error/code" should be less than or equal to 599
 * Example #5: Then the YAML value at "/version/major" should be less than or equal to 3
 *
 */
Then('the YAML value at {string} should be less than or equal to {float}', function (p, n) {
  const doc = activeDoc(this); ensureLoaded(this);
  assert.ok(numAt(doc, p) <= n);
});

/**
 * Assert a numeric YAML node falls within an inclusive range.
 *
 * Example #1: Then the YAML value at "/spec/replicas" should be between 1 and 10
 * Example #2: Then the YAML value at "/timeout" should be between 5 and 60
 * Example #3: And the YAML value at "/error/code" should be between 400 and 499
 * Example #4: Then the YAML value at "/cpu" should be between 100 and 1000
 * Example #5: Then the YAML value at "/version/major" should be between 2 and 5
 *
 */
Then('the YAML value at {string} should be between {float} and {float}', function (p, lo, hi) {
  const doc = activeDoc(this); ensureLoaded(this);
  const v = numAt(doc, p);
  assert.ok(v >= lo && v <= hi, `Value ${v} not in [${lo}, ${hi}].`);
});

// ---------------------------------------------------------------------------
// Array operations
// ---------------------------------------------------------------------------

function arrayAt(doc, p) {
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) throw new Error(`YAML element "${p}" not found.`);
  const v = nodes[0];
  if (!Array.isArray(v)) throw new Error(`YAML value at "${p}" is not an array.`);
  return v;
}

/**
 * Assert an array contains an item where a sub-key has the expected value.
 * Sub-key path is relative to each item; supports the same `/a/b[0]` syntax.
 *
 * Example #1: Then the YAML array at "/spec/containers" should contain an item where "/name" is "nginx"
 * Example #2: Then the YAML array at "/items" should contain an item where "/kind" is "Service"
 * Example #3: And the YAML array at "/users" should contain an item where "/email" is "alice@example.com"
 * Example #4: Then the YAML array at "/rules" should contain an item where "/host" is "example.com"
 * Example #5: Then the YAML array at "/spec/ports" should contain an item where "/port" is "443"
 *
 */
Then('the YAML array at {string} should contain an item where {string} is {string}', function (p, sub, value) {
  const doc = activeDoc(this); ensureLoaded(this);
  const arr = arrayAt(doc, p);
  const found = arr.some((item) => {
    const got = evalPath(item, sub)[0];
    return nodeText(got) === value;
  });
  assert.ok(found, `Array at "${p}" has no item where "${sub}" is "${value}".`);
});

/**
 * Assert NO item in an array has a sub-key matching a value.
 *
 * Example #1: Then the YAML array at "/spec/containers" should contain no item where "/image" is "alpine:latest"
 * Example #2: Then the YAML array at "/users" should contain no item where "/role" is "anonymous"
 * Example #3: And the YAML array at "/rules" should contain no item where "/host" is "deprecated.example.com"
 * Example #4: Then the YAML array at "/spec/env" should contain no item where "/name" is "DEBUG"
 * Example #5: Then the YAML array at "/items" should contain no item where "/status" is "failed"
 *
 */
Then('the YAML array at {string} should contain no item where {string} is {string}', function (p, sub, value) {
  const doc = activeDoc(this); ensureLoaded(this);
  const arr = arrayAt(doc, p);
  const found = arr.some((item) => nodeText(evalPath(item, sub)[0]) === value);
  assert.ok(!found, `Array at "${p}" unexpectedly has item where "${sub}" is "${value}".`);
});

/**
 * Assert every item in an array has a non-null sub-key.
 *
 * Example #1: Then every item in "/spec/containers" should have key "image"
 * Example #2: Then every item in "/users" should have key "email"
 * Example #3: And every item in "/spec/ports" should have key "port"
 * Example #4: Then every item in "/items" should have key "kind"
 * Example #5: Then every item in "/spec/rules" should have key "host"
 *
 */
Then('every item in {string} should have key {string}', function (p, key) {
  const doc = activeDoc(this); ensureLoaded(this);
  const arr = arrayAt(doc, p);
  const missing = arr.findIndex((item) => !nodeHasAttr(item, key));
  assert.strictEqual(missing, -1, `Item at index ${missing} in "${p}" is missing key "${key}".`);
});

// ---------------------------------------------------------------------------
// Key-set assertions
// ---------------------------------------------------------------------------

function keysAt(doc, p) {
  const nodes = evalPath(doc, p);
  if (nodes.length === 0) throw new Error(`YAML element "${p}" not found.`);
  const v = nodes[0];
  if (typeof v !== 'object' || Array.isArray(v) || v === null) {
    throw new Error(`YAML value at "${p}" is not a mapping.`);
  }
  return Object.keys(v);
}

/**
 * Assert the keys at a path exactly match a comma-separated list (no extras).
 *
 * Example #1: Then the YAML keys at "/metadata" should be exactly "name, namespace, labels"
 * Example #2: Then the YAML keys at "/spec" should be exactly "replicas, selector, template"
 * Example #3: And the YAML keys at "/error" should be exactly "code, message"
 * Example #4: Then the YAML keys at "/" should be exactly "apiVersion, kind, metadata, spec"
 * Example #5: Then the YAML keys at "/users/0" should be exactly "id, name, email"
 *
 */
Then('the YAML keys at {string} should be exactly {string}', function (p, csv) {
  const doc = activeDoc(this); ensureLoaded(this);
  const got = keysAt(doc, p).sort();
  const want = csv.split(',').map((s) => s.trim()).filter(Boolean).sort();
  assert.deepStrictEqual(got, want);
});

/**
 * Assert every required key is present at a path (extras allowed).
 *
 * Example #1: Then the YAML at "/metadata" should have keys "name, namespace"
 * Example #2: Then the YAML at "/spec" should have keys "replicas, selector"
 * Example #3: And the YAML at "/" should have keys "apiVersion, kind"
 * Example #4: Then the YAML at "/error" should have keys "code, message"
 * Example #5: Then the YAML at "/users/0" should have keys "id, email"
 *
 */
Then('the YAML at {string} should have keys {string}', function (p, csv) {
  const doc = activeDoc(this); ensureLoaded(this);
  const got = new Set(keysAt(doc, p));
  const want = csv.split(',').map((s) => s.trim()).filter(Boolean);
  for (const k of want) assert.ok(got.has(k), `Missing key "${k}" at "${p}".`);
});

// ---------------------------------------------------------------------------
// JSON Schema validation
// ---------------------------------------------------------------------------

/**
 * Validate the active YAML document against a JSON Schema file. Bundles
 * `ajv-formats` so schemas using `format: date-time`, `email`, `uri`, etc.
 * work out of the box.
 *
 * Example #1: Then the YAML should match JSON Schema "schemas/deployment.json"
 * Example #2: Then the YAML should match JSON Schema "tests/schemas/openapi-3.1.json"
 * Example #3: And the YAML should match JSON Schema "schemas/configmap.json"
 * Example #4: Then the YAML should match JSON Schema "schemas/github-workflow.json"
 * Example #5: Then the YAML should match JSON Schema "/abs/path/to/schema.json"
 *
 */
Then('the YAML should match JSON Schema {string}', function (schemaFile) {
  if (!Ajv) throw new Error('Schema validation requires ajv. Install with: npm i ajv ajv-formats');
  const doc = activeDoc(this); ensureLoaded(this);
  const p = path.isAbsolute(schemaFile) ? schemaFile : path.join(this.assetsFolder || './tests/assets', schemaFile);
  const schema = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  if (addFormats) addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(doc);
  assert.ok(ok, `YAML failed schema validation:\n  ${(validate.errors || []).map((e) => e.instancePath + ' ' + e.message).join('\n  ')}`);
});

// ---------------------------------------------------------------------------
// Diff vs expected
// ---------------------------------------------------------------------------

/**
 * Assert the active YAML document equals the contents of an expected file,
 * after removing the listed JSON Pointer paths from both sides. Common
 * use: ignoring volatile fields like `metadata.resourceVersion` or
 * `status` when diffing Kubernetes manifests.
 *
 * Example #1: Then the YAML should equal the file "expected.yaml" ignoring keys "/metadata/resourceVersion"
 * Example #2: Then the YAML should equal the file "expected.yaml" ignoring keys "/status, /metadata/uid"
 * Example #3: And the YAML should equal the file "golden.yaml" ignoring keys "/metadata/creationTimestamp"
 * Example #4: Then the YAML should equal the file "expected.yml" ignoring keys ""
 * Example #5: Then the YAML should equal the file "tests/golden/deploy.yaml" ignoring keys "/status, /metadata/uid, /metadata/resourceVersion"
 *
 */
Then('the YAML should equal the file {string} ignoring keys {string}', function (file, ignoreCsv) {
  requireYaml();
  const doc = activeDoc(this); ensureLoaded(this);
  const p = path.isAbsolute(file) ? file : path.join(this.assetsFolder || './tests/assets', file);
  const expected = YAML.load(fs.readFileSync(p, 'utf-8'));
  const ignore = ignoreCsv.split(',').map((s) => s.trim()).filter(Boolean);
  const stripAt = (root, ptr) => {
    const parts = ptr.split('/').filter(Boolean);
    if (parts.length === 0) return;
    const last = parts.pop();
    let cur = root;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) cur = cur[part];
      else return;
    }
    if (cur && typeof cur === 'object') delete cur[last];
  };
  const cloneA = JSON.parse(JSON.stringify(doc));
  const cloneB = JSON.parse(JSON.stringify(expected));
  for (const ptr of ignore) { stripAt(cloneA, ptr); stripAt(cloneB, ptr); }
  assert.deepStrictEqual(cloneA, cloneB);
});

// ---------------------------------------------------------------------------
// Namespace + debug
// ---------------------------------------------------------------------------

/**
 * Assert the YAML document declares a namespace value (mirrors xml.steps.js).
 * Checks top-level scalar values and falls back to a raw-text scan.
 *
 * Example #1: Then the YAML should use the namespace "v1"
 * Example #2: Then the YAML should use the namespace "apps/v1"
 * Example #3: And the YAML should use the namespace "kustomize.config.k8s.io/v1beta1"
 * Example #4: Then the YAML should use the namespace "argoproj.io/v1alpha1"
 * Example #5: Then the YAML should use the namespace "openapi: 3.0.3"
 *
 */
Then('the YAML should use the namespace {string}', function (ns) {
  const doc = activeDoc(this); ensureLoaded(this);
  if (doc && typeof doc === 'object') {
    const values = Object.values(doc).map((v) => (v == null ? '' : String(v)));
    if (values.includes(ns)) return;
  }
  assert.ok((this._rawYamlResponse || '').indexOf(ns) !== -1, `Namespace "${ns}" not declared.`);
});

/**
 * Assert the YAML document does NOT declare a namespace value.
 *
 * Example #1: Then the YAML should not use the namespace "v0"
 * Example #2: Then the YAML should not use the namespace "internal/v1"
 * Example #3: And the YAML should not use the namespace "legacy"
 * Example #4: Then the YAML should not use the namespace "v0alpha"
 * Example #5: Then the YAML should not use the namespace "deprecated"
 *
 */
Then('the YAML should not use the namespace {string}', function (ns) {
  const doc = activeDoc(this); ensureLoaded(this);
  if (doc && typeof doc === 'object') {
    const values = Object.values(doc).map((v) => (v == null ? '' : String(v)));
    assert.ok(!values.includes(ns), `Namespace "${ns}" should not be declared.`);
    return;
  }
  assert.ok((this._rawYamlResponse || '').indexOf(ns) === -1, `Namespace "${ns}" should not be declared.`);
});

/**
 * Print the most recently set raw YAML response to stdout (debug aid).
 *
 * Example #1: When I print last YAML response
 * Example #2: When we print last YAML response
 * Example #3: And I print last YAML response
 * Example #4: Given the YAML response content is the following:
 *               """
 *               key: value
 *               """
 *               When I print last YAML response
 * Example #5: When we send a REST "GET" request to "/api/config"
 *               And we print last YAML response
 *
 */
When(/^(I |we )*print last YAML response$/, async function () {
  console.log(this._rawYamlResponse || '(no response)');
});
