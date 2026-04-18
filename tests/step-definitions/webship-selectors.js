'use strict';

// ---------------------------------------------------------------------------
// Webship-JS — Selectors step definitions
//
// Uses Playwright Locator API (locator.boundingBox, locator.isVisible,
// locator.isHidden, locator.click) to assert named page components are
// positioned relative to each other: above, below, left, right, inside,
// outside, over, not over. Also asserts visibility, focus, and click.
//
// Advanced selector system: named CSS and XPath selectors + layout components
// + viewport breakpoints — all configured under one `selectors` block, loaded
// from worldParameters, JSON files, or registered inline via steps.
//
// Configuration: resolved per-scenario with this priority:
//   1. process.env.WEBSHIP_SELECTORS_*             (CI / shell — highest)
//   2. cucumber.js worldParameters.selectors.*     (project-level defaults)
//   3. built-in defaults
//
// Supported env vars / worldParameters keys:
//   WEBSHIP_SELECTORS_OFFSET      offset        scroll offset in px, default 60
//   WEBSHIP_SELECTORS_BREAKPOINTS (JSON string) named breakpoints
//
// Unified config block (worldParameters.selectors):
//   selectors: {
//     filesPath: './tests/selectors/',           // base path for selector files
//     files: ['front-end-selectors.json', 'back-end-selectors.json'],
//     css: {
//       'page header': 'header.page-header',
//       'main nav': 'nav[role="navigation"]',
//     },
//     xpath: {
//       'page title': '//h1[contains(@class,"page-title")]',
//     },
//     offset: 60,                                // scroll offset (px)
//     breakpoints: {
//       xs:   { width: 375,  height: 667  },                // phone portrait
//       sm:   { width: 576,  height: 800  },                // large phone / phablet
//       md:   { width: 768,  height: 1024 },                // tablet portrait
//       lg:   { width: 992,  height: 768  },                // small laptop / tablet landscape
//       xl:   { width: 1200, height: 900, default: true },  // desktop
//       xxl:  { width: 1400, height: 900  },                // wide desktop / HD
//       xxxl: { width: 1920, height: 1080 },                // Full HD / large monitor
//     },
//   }
//
// Selector files (JSON only) have the structure:
//   {
//     "css":   { "breadcrumb": ".breadcrumb", "logo": "header .logo" },
//     "xpath": { "page title": "//h1[contains(@class,'title')]" }
//   }
//
// One unified CSS registry: layout components and element locators share
// worldParameters.selectors.css. Register in bulk via "Given I define css selectors:"
// or one-at-a-time via "When I add ... css selector". Same for XPath via `xpath`.
// ---------------------------------------------------------------------------

const { Given, When, Then, Before } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');

function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.json') {
    throw new Error(`Selector files must be JSON (got "${ext}" for "${filePath}").`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function pick(envVal, paramVal, fallback) {
  if (envVal !== undefined && envVal !== '') return envVal;
  if (paramVal !== undefined && paramVal !== '' && paramVal !== null) return paramVal;
  return fallback;
}

function resolveConfig(parameters) {
  const s = (parameters && parameters.selectors) || {};

  let breakpoints = s.breakpoints || {
    xs:   { width: 375,  height: 667  },
    sm:   { width: 576,  height: 800  },
    md:   { width: 768,  height: 1024 },
    lg:   { width: 992,  height: 768  },
    xl:   { width: 1200, height: 900, default: true },
    xxl:  { width: 1400, height: 900  },
    xxxl: { width: 1920, height: 1080 },
  };

  if (process.env.WEBSHIP_SELECTORS_BREAKPOINTS) {
    try { breakpoints = JSON.parse(process.env.WEBSHIP_SELECTORS_BREAKPOINTS); } catch { /* ignore */ }
  }

  return {
    offset:     parseInt(pick(process.env.WEBSHIP_SELECTORS_OFFSET, s.offset, '60'), 10),
    breakpoints,
    filesPath:  s.filesPath || '',
    files:      Array.isArray(s.files) ? s.files : [],
    css:        Object.assign({}, s.css  || {}),
    xpath:      Object.assign({}, s.xpath || {}),
  };
}

// ---------------------------------------------------------------------------
// Per-scenario registries
// ---------------------------------------------------------------------------
Before(function () {
  const cfg = resolveConfig(this.parameters);
  this.__selectorsConfig = cfg;
  this.__selectorsCss    = Object.assign({}, cfg.css);
  this.__selectorsXpath  = Object.assign({}, cfg.xpath);

  // Auto-load selector files specified in worldParameters.
  for (const file of cfg.files) {
    const filePath = cfg.filesPath ? path.join(cfg.filesPath, file) : file;
    try {
      const parsed = parseFile(filePath);
      if (parsed && parsed.css)   Object.assign(this.__selectorsCss,   parsed.css);
      if (parsed && parsed.xpath) Object.assign(this.__selectorsXpath, parsed.xpath);
    } catch (e) {
      throw new Error(`Selectors: failed to load selector file "${filePath}": ${e.message}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Selector resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a named selector to a Playwright-compatible selector string.
 * Priority: css registry → xpath registry.
 */
function resolveSelector(world, name) {
  const trimmed = name.trim();

  if (world.__selectorsCss && world.__selectorsCss[trimmed]) {
    return world.__selectorsCss[trimmed];
  }

  if (world.__selectorsXpath && world.__selectorsXpath[trimmed]) {
    const xp = world.__selectorsXpath[trimmed];
    return xp.startsWith('xpath=') ? xp : `xpath=${xp}`;
  }

  throw new Error(`Selectors: unknown selector "${trimmed}". Register it with "Given I define css selectors:", "When I add ... css selector", "When I add ... xpath selector", or worldParameters.selectors.`);
}

function parseNames(text) {
  return text.split(/\s*(?:,|and)\s*/).map(s => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Geometry helpers using Playwright locator.boundingBox()
// ---------------------------------------------------------------------------
async function getGeometry(page, selector) {
  const loc = page.locator(selector).first();
  try { await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch { /* may already be visible */ }

  const box = await loc.boundingBox();
  if (!box) return null;

  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));

  // z-index still requires evaluate — no native Playwright API for computed style.
  const zIndex = await loc.evaluate(el => {
    let z = 0;
    let node = el;
    while (node && node !== document.body) {
      const cs = window.getComputedStyle(node);
      if (cs.position !== 'static' && cs.zIndex !== 'auto') {
        const n = parseInt(cs.zIndex, 10);
        if (!isNaN(n)) z = n;
      }
      node = node.parentElement;
    }
    return z;
  });

  return { top: box.y + scroll.y, left: box.x + scroll.x, width: box.width, height: box.height, zIndex };
}

async function assertPosition(page, position, c1Name, c1Sel, c2Name, c2Sel) {
  const g1 = await getGeometry(page, c1Sel);
  if (!g1) throw new Error(`Cannot get bounding box for "${c1Name}" (${c1Sel}) — element not visible`);
  const g2 = await getGeometry(page, c2Sel);
  if (!g2) throw new Error(`Cannot get bounding box for "${c2Name}" (${c2Sel}) — element not visible`);

  let pass = false;
  switch (position) {
    case 'above':   pass = g2.top >= g1.top + g1.height; break;
    case 'below':   pass = g1.top >= g2.top + g2.height; break;
    case 'left':    pass = g1.left + g1.width <= g2.left; break;
    case 'right':   pass = g1.left >= g2.left + g2.width; break;
    case 'inside':
      pass = g1.top  >= g2.top  && g1.top  + g1.height <= g2.top  + g2.height &&
             g1.left >= g2.left && g1.left + g1.width  <= g2.left + g2.width;
      break;
    case 'outside':
      pass = g1.top  <= g2.top  && g1.top  + g1.height >= g2.top  + g2.height &&
             g1.left <= g2.left && g1.left + g1.width  >= g2.left + g2.width;
      break;
    case 'over': {
      const intersects = !(g1.left >= g2.left + g2.width || g1.left + g1.width <= g2.left ||
                           g1.top  >= g2.top  + g2.height || g1.top  + g1.height <= g2.top);
      pass = intersects && g1.zIndex <= g2.zIndex;
      break;
    }
  }
  return pass;
}

async function dispatcher(world, position, subjectText, othersText, negate = false) {
  const subjects = parseNames(subjectText);
  const others   = parseNames(othersText);
  const errors   = [];
  for (const subjectName of subjects) {
    const subjectSel = resolveSelector(world, subjectName);
    for (const otherName of others) {
      const otherSel = resolveSelector(world, otherName);
      try {
        const pass = await assertPosition(world.page, position, subjectName, subjectSel, otherName, otherSel);
        if (!pass && !negate) errors.push(`"${subjectName}" is not ${position} "${otherName}"`);
        else if (pass && negate) errors.push(`"${subjectName}" is ${position} "${otherName}" (expected not to be)`);
      } catch (e) { errors.push(e.message); }
    }
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));
}

// ===========================================================================
// STEP DEFINITIONS — Advanced selector system
// ===========================================================================

/**
 * Register a named CSS selector at runtime.
 *
 * Example #1: When I add "mobile logo" selector for "header img#logo" css selector
 * Example #2: When I add "breadcrumb" selector for ".breadcrumb" css selector
 * Example #3: When I add "breadcrumb first link" selector for ".breadcrumb li:nth-child(1) a" css selector
 * Example #4: When I add "cta button" selector for ".cta .btn-primary" css selector
 * Example #5: When I add "page header" selector for "header.page-header" css selector
 * Example #6: When I add "main nav" selector for "nav[role='navigation']" css selector
 * Example #7: When I add "hero image" selector for ".hero img" css selector
 * Example #8: When I add "footer links" selector for "footer a" css selector
 * Example #9: When I add "search field" selector for "input[type='search']" css selector
 * Example #10: When I add "submit button" selector for "button[type='submit']" css selector
 *
 * Advanced:
 * Example #11: Later override same name → latest wins:
 *   When I add "target" selector for "h1" css selector
 *   And   I add "target" selector for "ul" css selector
 * Example #12: Component (CSS) takes precedence over CSS registry with same name:
 *   When I add "shared" selector for "ul" css selector
 *   And  I define css selectors:
 *     | shared | h1 |
 * Example #13: Combine with XPath registration and use together:
 *   When I add "cta" selector for ".cta" css selector
 *   And  I add "cta link" selector for "//a[contains(@class,'cta')]" xpath selector
 */
When(/^(I |we )*add "([^"]*)" selector for "([^"]*)" css selector$/, function (pronounCase, selectorName, cssSelector) {
  if (!selectorName || !cssSelector) throw new Error('Selectors: selector name and CSS selector must not be empty.');
  this.__selectorsCss[selectorName.trim()] = cssSelector.trim();
});

/**
 * Register a named XPath selector at runtime.
 *
 * Example #1: When I add "page title" selector for "//h1[contains(@class,'page-header')]" xpath selector
 * Example #2: When I add "Dashboard" selector for "//*[@id='navbar-link-admin-dashboard']" xpath selector
 * Example #3: When I add "Vertical orientation" selector for "//*[@id='navbar-item--2-tray']/div/div[2]/div/button" xpath selector
 * Example #4: When I add "admin menu" selector for "//nav[contains(@class,'admin-menu')]" xpath selector
 * Example #5: When I add "first table row" selector for "//table/tbody/tr[1]" xpath selector
 * Example #6: When I add "active tab" selector for "//li[contains(@class,'active')]/a" xpath selector
 * Example #7: When I add "error message" selector for "//*[contains(@class,'error')]" xpath selector
 * Example #8: When I add "site name" selector for "//a[contains(@class,'site-name')]" xpath selector
 * Example #9: When I add "user menu" selector for "//*[@id='user-menu']" xpath selector
 * Example #10: When I add "language switcher" selector for "//ul[contains(@class,'language-switcher')]" xpath selector
 *
 * Advanced:
 * Example #11: Axis predicates — first match only (locator.first() is applied):
 *   When I add "first row" selector for "//table//tr[1]" xpath selector
 * Example #12: Text contains — name by rendered label:
 *   When I add "login link" selector for "//a[contains(normalize-space(.),'Login')]" xpath selector
 * Example #13: Attribute + position — last nav item:
 *   When I add "last nav item" selector for "//nav[@role='navigation']//a[last()]" xpath selector
 */
When(/^(I |we )*add "([^"]*)" selector for "([^"]*)" xpath selector$/, function (pronounCase, selectorName, xpathSelector) {
  if (!selectorName || !xpathSelector) throw new Error('Selectors: selector name and XPath selector must not be empty.');
  this.__selectorsXpath[selectorName.trim()] = xpathSelector.trim();
});

/**
 * Load CSS and XPath selectors from a JSON file.
 * File path is relative to worldParameters.selectors.filesPath.
 *
 * Example #1: When I add selectors from "selectors.json" file
 * Example #2: When I add selectors from "admin-selectors.json" file
 * Example #3: When I add selectors from "frontend.json" file
 * Example #4: When I add selectors from "theme-selectors.json" file
 * Example #5: When I add selectors from "components.json" file
 * Example #6: When we add selectors from "shared.json" file
 * Example #7: When add selectors from "backend.json" file
 * Example #8: When I add selectors from "page-selectors.json" file
 * Example #9: When I add selectors from "module-selectors.json" file
 * Example #10: When we add selectors from "mobile.json" file
 *
 * Advanced:
 * Example #11: Load a file then override a single entry inline:
 *   When I add selectors from "homepage-selectors.json" file
 *   And  I add "homepage heading" selector for "header h1" css selector
 * Example #12: Load multiple files — later files override earlier keys:
 *   When I add selectors from "front-end-selectors.json" file
 *   And  I add selectors from "back-end-selectors.json" file
 * Example #13: File + inline xpath + component — all three registries merged:
 *   When I add selectors from "homepage-selectors.json" file
 *   And  I add "extra link" selector for "//a[@rel='canonical']" xpath selector
 *   And  I define css selectors:
 *     | wrapper | #main |
 */
When(/^(I |we )*add selectors from "([^"]*)" file$/, function (pronounCase, fileName) {
  const cfg = this.__selectorsConfig;
  if (!fileName) throw new Error('Selectors: file name must not be empty.');
  if (!cfg.filesPath) throw new Error('Selectors: worldParameters.selectors.filesPath must be set to load selector files.');
  const filePath = path.join(cfg.filesPath, fileName);
  let parsed;
  try { parsed = parseFile(filePath); } catch (e) {
    throw new Error(`Selectors: failed to load selector file "${filePath}": ${e.message}`);
  }
  if (parsed && parsed.css)   Object.assign(this.__selectorsCss,   parsed.css);
  if (parsed && parsed.xpath) Object.assign(this.__selectorsXpath, parsed.xpath);
});

/**
 * Print all registered CSS selectors to console (debug/inspection).
 *
 * Example #1: Then I print css selectors
 * Example #2: When I print css selectors
 * Example #3: Then we print css selectors
 * Example #4: When we print css selectors
 * Example #5: Then print css selectors
 * Example #6: When print css selectors
 * Example #7: And I print css selectors
 * Example #8: And we print css selectors
 * Example #9: Given I print css selectors
 * Example #10: But I print css selectors
 */
Then(/^(I |we )*print css selectors$/, function (_pronounCase) {
  console.log('\n--- CSS Selectors ---');
  for (const [name, sel] of Object.entries(this.__selectorsCss || {})) {
    console.log(`  "${name}": ${sel}`);
  }
});

/**
 * Print all registered XPath selectors to console (debug/inspection).
 *
 * Example #1: Then I print xpath selectors
 * Example #2: When I print xpath selectors
 * Example #3: Then we print xpath selectors
 * Example #4: When we print xpath selectors
 * Example #5: Then print xpath selectors
 * Example #6: When print xpath selectors
 * Example #7: And I print xpath selectors
 * Example #8: And we print xpath selectors
 * Example #9: Given I print xpath selectors
 * Example #10: But I print xpath selectors
 */
Then(/^(I |we )*print xpath selectors$/, function (_pronounCase) {
  console.log('\n--- XPath Selectors ---');
  for (const [name, sel] of Object.entries(this.__selectorsXpath || {})) {
    console.log(`  "${name}": ${sel}`);
  }
});

// ===========================================================================
// STEP DEFINITIONS — Layout components
// ===========================================================================

/**
 * Define named CSS selectors in bulk for the current scenario.
 *
 * Example #1:
 *   Given I define css selectors:
 *     | header  | #header        |
 *     | nav     | nav.primary    |
 *     | footer  | footer         |
 *
 * Example #2:
 *   Given I define css selectors:
 *     | logo    | .site-logo     |
 *     | search  | #search-input  |
 *
 * Example #3:
 *   Given I define css selectors:
 *     | hero    | .hero-banner   |
 *     | content | .main-content  |
 *     | sidebar | .sidebar       |
 *
 * Example #4:
 *   Given I define css selectors:
 *     | menu    | ul.menu        |
 *     | button  | .cta-button    |
 *
 * Example #5:
 *   Given I define css selectors:
 *     | top bar | .top-bar       |
 *     | page    | #page-wrapper  |
 *     | footer  | .site-footer   |
 *
 * Example #6:
 *   Given we define css selectors:
 *     | modal   | .modal-dialog  |
 *     | overlay | .modal-backdrop |
 *
 * Example #7:
 *   When I define css selectors:
 *     | input   | input[name=q]  |
 *     | button  | button[type=submit] |
 *
 * Example #8:
 *   And I define css selectors:
 *     | card    | .card          |
 *     | title   | .card-title    |
 *
 * Example #9:
 *   Given define css selectors:
 *     | heading | h1             |
 *     | list    | ul             |
 *
 * Example #10:
 *   Given I define css selectors:
 *     | left    | .col-left      |
 *     | center  | .col-center    |
 *     | right   | .col-right     |
 *
 * Advanced:
 * Example #11: Later entry with same name overrides earlier:
 *   When  I add "shared" selector for "ul" css selector
 *   Given I define css selectors:
 *     | shared | h1 |
 *   Then I see visible shared   # resolves to h1 (latest wins).
 *
 * Example #12: Define + use in position + visibility asserts:
 *   Given I define css selectors:
 *     | heading | h1 |
 *     | list    | ul |
 *   Then I see visible heading, list
 *   And  I see heading above list
 *
 * Example #13: Layered page-shell selectors:
 *   Given I define css selectors:
 *     | topbar  | .topbar         |
 *     | header  | header.site     |
 *     | nav     | nav[role=navigation] |
 *     | main    | main            |
 *     | footer  | footer          |
 */
Given(/^(I |we )*define css selectors:$/, function (pronounCase, dataTable) {
  for (const [name, selector] of dataTable.raw()) {
    if (name && selector) this.__selectorsCss[name.trim()] = selector.trim();
  }
});

/**
 * Define named XPath selectors in bulk for the current scenario.
 *
 * Example #1:
 *   Given I define xpath selectors:
 *     | first heading | //h1[1]              |
 *     | first subline | //h3[1]              |
 * Example #2:
 *   Given we define xpath selectors:
 *     | active tab   | //li[contains(@class,'active')]/a |
 * Example #3:
 *   Given define xpath selectors:
 *     | last nav item | //nav//a[last()] |
 * Example #4:
 *   And I define xpath selectors:
 *     | login link    | //a[contains(normalize-space(.),'Login')] |
 * Example #5:
 *   When I define xpath selectors:
 *     | error message | //*[contains(@class,'error')] |
 * Example #6:
 *   Given I define xpath selectors:
 *     | first table row | //table/tbody/tr[1] |
 *     | first table cell| //table/tbody/tr[1]/td[1] |
 * Example #7:
 *   Given I define xpath selectors:
 *     | page title | //h1[contains(@class,'page-header')] |
 * Example #8:
 *   Given I define xpath selectors:
 *     | admin menu | //nav[contains(@class,'admin-menu')] |
 * Example #9:
 *   Given I define xpath selectors:
 *     | language switcher | //ul[contains(@class,'language-switcher')] |
 * Example #10:
 *   Given I define xpath selectors:
 *     | user menu | //*[@id='user-menu'] |
 */
Given(/^(I |we )*define xpath selectors:$/, function (pronounCase, dataTable) {
  for (const [name, selector] of dataTable.raw()) {
    if (name && selector) this.__selectorsXpath[name.trim()] = selector.trim();
  }
});

/**
 * Resize viewport to a named breakpoint.
 * Built-in names: xs, sm, md, lg, xl, xxl, xxxl.
 *
 *   xs   375 x 667    phone portrait
 *   sm   576 x 800    large phone / phablet
 *   md   768 x 1024   tablet portrait
 *   lg   992 x 768    small laptop / tablet landscape
 *   xl   1200 x 900   desktop (default)
 *   xxl  1400 x 900   wide desktop / HD
 *   xxxl 1920 x 1080  Full HD / large monitor
 *
 * Example #1: Given I am viewing the site on a xl screen
 * Example #2: Given I am viewing the site on a xs screen
 * Example #3: Given I am viewing the site on a md screen
 * Example #4: Given I am viewing the site on a "xl" screen
 * Example #5: Given I am viewing the site on a lg device
 * Example #6: Given I am viewing the site on a "sm" device
 * Example #7: Given I am viewing the site on a xxl screen
 * Example #8: Given I am viewing the site on a "xxxl" screen
 * Example #9: Given I am viewing the site on a xxxl device
 * Example #10: Given I am viewing the site on a "xxl" device
 * Example #11: Given we are viewing the site on a xs screen
 * Example #12: Given viewing the site on a lg screen
 */
Given(/^(I am |we are )?viewing the site on a (?:"([^"]+)"|([a-zA-Z0-9 _,]+)) (?:screen|device)$/, async function (pronounCase, quoted, bare) {
  const name = (quoted || bare || '').trim();
  const cfg = this.__selectorsConfig;
  if (!cfg.breakpoints[name]) throw new Error(`Selectors: breakpoint "${name}" not defined in worldParameters.selectors.breakpoints.`);
  const { width, height } = cfg.breakpoints[name];
  await this.page.setViewportSize({ width, height });
});

// ===========================================================================
// STEP DEFINITIONS — Relative position assertions
// ===========================================================================

/**
 * Assert a subject locator is above one or more others (absolute page coordinates).
 *
 * Example #1: Then I see header above footer
 * Example #2: Then I see logo above search
 * Example #3: Then I see nav above content, footer
 * Example #4: Then I see hero above sidebar and footer
 * Example #5: Then I see top bar above nav, content and footer
 * Example #6: Then I see heading above subline
 * Example #7: Then I see nav above content
 * Example #8: Then I see search above results
 * Example #9: Then I see banner above body
 * Example #10: Then I see menu above page
 *
 * Advanced — multi-subject / multi-target dispatch:
 * Example #11: Single subject, many targets (comma + "and"):
 *   Then I see heading above subline, list and footer
 * Example #12: Many subjects, single target:
 *   Then I see heading, subline above list
 * Example #13: Cartesian — many subjects × many targets:
 *   Then I see heading, subline above list, footer
 * Example #14: Combined with inline xpath registration:
 *   When I add "first heading xp" selector for "//h1[1]" xpath selector
 *   Then I see first heading xp above list
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) above ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'above', subject, others);
});

/**
 * Assert a subject locator is below one or more others.
 *
 * Example #1: Then I see footer below header
 * Example #2: Then I see content below nav
 * Example #3: Then I see footer below header, nav and content
 * Example #4: Then I see results below search
 * Example #5: Then I see sidebar below hero
 * Example #6: Then I see list below heading
 * Example #7: Then I see nav below top bar
 * Example #8: Then I see content below logo
 * Example #9: Then I see page below menu
 * Example #10: Then I see body below banner
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) below ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'below', subject, others);
});

/**
 * Assert a subject locator is to the left of one or more others.
 *
 * Example #1: Then I see logo to the left of nav
 * Example #2: Then I see sidebar to left of content
 * Example #3: Then I see search to the left of search button
 * Example #4: Then I see menu to the left of cta
 * Example #5: Then I see label to left of input
 * Example #6: Then I see icon to the left of title
 * Example #7: Then I see thumbnail to the left of description
 * Example #8: Then I see avatar to left of username
 * Example #9: Then I see back button to the left of forward button
 * Example #10: Then I see flag to left of country name
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) to (?:the )?left of ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'left', subject, others);
});

/**
 * Assert a subject locator is to the right of one or more others.
 *
 * Example #1: Then I see nav to the right of logo
 * Example #2: Then I see content to right of sidebar
 * Example #3: Then I see search button to the right of search
 * Example #4: Then I see cta to the right of menu
 * Example #5: Then I see input to right of label
 * Example #6: Then I see title to the right of icon
 * Example #7: Then I see description to the right of thumbnail
 * Example #8: Then I see username to right of avatar
 * Example #9: Then I see forward button to the right of back button
 * Example #10: Then I see country name to right of flag
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) to (?:the )?right of ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'right', subject, others);
});

/**
 * Assert a subject locator's bounding box is fully inside another's.
 *
 * Example #1: Then I see logo inside of header
 * Example #2: Then I see nav inside of header
 * Example #3: Then I see search inside of header
 * Example #4: Then I see cta inside of hero
 * Example #5: Then I see label inside of form
 * Example #6: Then I see icon inside of button
 * Example #7: Then I see title inside of banner
 * Example #8: Then I see content inside of page
 * Example #9: Then I see sidebar inside of page
 * Example #10: Then I see footer inside of page
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) inside of ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'inside', subject, others);
});

/**
 * Assert a subject locator's bounding box fully contains another's.
 *
 * Example #1: Then I see header outside of logo
 * Example #2: Then I see header outside of nav
 * Example #3: Then I see hero outside of cta
 * Example #4: Then I see form outside of label
 * Example #5: Then I see button outside of icon
 * Example #6: Then I see banner outside of title
 * Example #7: Then I see page outside of content
 * Example #8: Then I see page outside of sidebar
 * Example #9: Then I see page outside of footer
 * Example #10: Then I see wrapper outside of inner
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) outside of ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'outside', subject, others);
});

/**
 * Assert a subject locator overlaps another via intersection and z-index.
 *
 * Example #1: Then I see modal over content
 * Example #2: Then I see dropdown over nav
 * Example #3: Then I see tooltip over label
 * Example #4: Then I see overlay over page
 * Example #5: Then I see popup over hero
 * Example #6: Then I see sticky header over content
 * Example #7: Then I see cookie banner over footer
 * Example #8: Then I see dialog over sidebar
 * Example #9: Then I see notification over header
 * Example #10: Then I see lightbox over page
 */
Then(/^(I |we )*see ((?:[a-zA-Z0-9 ,\-](?!not))+) over ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'over', subject, others);
});

/**
 * Assert a subject locator does NOT overlap another element.
 *
 * Example #1: Then I see header not over content
 * Example #2: Then I see nav not over sidebar
 * Example #3: Then I see footer not over content
 * Example #4: Then I see logo not over search
 * Example #5: Then I see sidebar not over footer
 * Example #6: Then I see menu not over hero
 * Example #7: Then I see label not over input
 * Example #8: Then I see icon not over title
 * Example #9: Then I see button not over form
 * Example #10: Then I see nav not over page
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) not over ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subject, others) {
  await dispatcher(this, 'over', subject, others, true);
});

// ===========================================================================
// STEP DEFINITIONS — Visibility and focus (uses locator.isVisible / isHidden)
// ===========================================================================

/**
 * Assert one or more named locators are visible.
 *
 * Example #1: Then I see visible header
 * Example #2: Then I see visible nav, footer
 * Example #3: Then I see visible logo and search
 * Example #4: Then I see visible cta
 * Example #5: Then I see visible hero, content and sidebar
 * Example #6: Then I see visible menu
 * Example #7: Then I see visible search button
 * Example #8: Then I see visible banner
 * Example #9: Then I see visible footer
 * Example #10: Then I see visible top bar, nav and content
 *
 * Advanced:
 * Example #11: Mix of components, inline CSS, inline XPath — all resolve:
 *   When I add "page heading" selector for "h1" css selector
 *   And  I add "first para" selector for "//p[1]" xpath selector
 *   Then I see visible page heading, first para
 * Example #12: After breakpoint resize — assert still visible:
 *   Given I am viewing the site on a xs screen
 *   Then  I see visible heading, list
 * Example #13: After loading a selector file — names from file are visible:
 *   When I add selectors from "homepage-selectors.json" file
 *   Then I see visible homepage heading, homepage first heading
 */
Then(/^(I |we )*see visible ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subjectsText) {
  const names = parseNames(subjectsText);
  const errors = [];
  for (const name of names) {
    const sel = resolveSelector(this, name);
    // Playwright native auto-retrying assertion — waits until the locator becomes visible.
    try { await this.page.locator(sel).first().waitFor({ state: 'visible', timeout: 5000 }); }
    catch { errors.push(`"${name}" (${sel}) is not visible`); }
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));
});

/**
 * Assert one or more named locators are hidden.
 *
 * Example #1: Then I don't see modal
 * Example #2: Then I don't see dropdown, tooltip
 * Example #3: Then I don't see overlay
 * Example #4: Then I don't see cookie banner
 * Example #5: Then I don't see popup
 * Example #6: Then I don't see notification
 * Example #7: Then I don't see lightbox
 * Example #8: Then I don't see sticky header
 * Example #9: Then I don't see dialog
 * Example #10: Then I don't see sidebar, overlay and popup
 */
Then(/^(I |we )*(don't|do not) see ([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, negation, subjectsText) {
  const names = parseNames(subjectsText);
  const errors = [];
  for (const name of names) {
    const sel = resolveSelector(this, name);
    // Playwright native auto-retrying assertion — waits until the locator is detached or hidden.
    try { await this.page.locator(sel).first().waitFor({ state: 'hidden', timeout: 5000 }); }
    catch { errors.push(`"${name}" (${sel}) is visible (expected hidden)`); }
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));
});

/**
 * Assert a named locator has keyboard focus.
 *
 * Example #1: Then search has focus
 * Example #2: Then email input has focus
 * Example #3: Then submit button has focus
 * Example #4: Then username has focus
 * Example #5: Then password has focus
 * Example #6: Then search button has focus
 * Example #7: Then first link has focus
 * Example #8: Then skip link has focus
 * Example #9: Then close button has focus
 * Example #10: Then modal heading has focus
 */
Then(/^(I |we )*see ([a-zA-Z0-9 ,\-]+) has focus$/, async function (pronounCase, subjectText) {
  const name = subjectText.trim();
  const sel = resolveSelector(this, name);
  const loc = this.page.locator(sel).first();
  // Playwright native auto-retrying focus check via waitForFunction.
  try {
    await loc.waitFor({ state: 'attached', timeout: 5000 });
    const handle = await loc.elementHandle();
    await this.page.waitForFunction((el) => el === document.activeElement, handle, { timeout: 5000 });
  } catch {
    throw new Error(`"${name}" (${sel}) does not have focus`);
  }
});

// ===========================================================================
// STEP DEFINITIONS — Focus and text selection
// ===========================================================================

/**
 * Resolve a form field by label → placeholder → role=textbox → [name]/#id.
 * Uses Playwright's ready-made semantic locators (getByLabel, getByPlaceholder,
 * getByRole) with .or() fallbacks — matches the accessibility-first lookup
 * chain recommended by https://playwright.dev/docs/locators.
 */
function resolveField(page, field) {
  return page.getByLabel(field).or(
    page.getByPlaceholder(field)
  ).or(
    page.getByRole('textbox', { name: field })
  ).or(
    page.locator(`[name="${field}"], #${field}`)
  ).first();
}

/**
 * Move keyboard focus to a field by label, name, or id.
 *
 * Example #1: When I move focus to "Title" field
 * Example #2: When I move focus to "Body" field
 * Example #3: When I move focus to "Email" field
 * Example #4: When I move focus to "Search" field
 * Example #5: When I move focus to "Username" field
 * Example #6: When I move focus to "Password" field
 * Example #7: When I move focus to "First name" field
 * Example #8: When I move focus to "Last name" field
 * Example #9: When I move focus to "Description" field
 * Example #10: When I move focus to "Phone" field
 */
When(/^(I |we )*move focus to "([^"]*)" field$/, async function (pronounCase, fieldLabel) {
  const loc = resolveField(this.page, fieldLabel);
  await loc.focus();
});

/**
 * Select all text inside a field by label, name, or id.
 *
 * Example #1: When I select all text in "Title" field
 * Example #2: When I select all text in "Description" field
 * Example #3: When I select all text in "Body" field
 * Example #4: When I select all text in "Email" field
 * Example #5: When I select all text in "Username" field
 * Example #6: When I select all text in "Search" field
 * Example #7: When I select all text in "Name" field
 * Example #8: When I select all text in "Notes" field
 * Example #9: When I select all text in "Address" field
 * Example #10: When I select all text in "Message" field
 */
When(/^(I |we )*select all text in "([^"]*)" field$/, async function (pronounCase, fieldLabel) {
  const loc = resolveField(this.page, fieldLabel);
  await loc.focus();
  await loc.selectText();
});

/**
 * Select a character range (from..to) inside a field.
 *
 * Example #1: When I select from 0 to 5 text in "Title" field
 * Example #2: When I select from 0 to 10 text in "Body" field
 * Example #3: When I select from 3 to 8 text in "Description" field
 * Example #4: When I select from 0 to 5 text in "Email" field
 * Example #5: When I select from 2 to 6 text in "Username" field
 * Example #6: When we select from 0 to 4 text in "Name" field
 * Example #7: When select from 1 to 7 text in "Search" field
 * Example #8: When I select from 0 to 20 text in "Notes" field
 * Example #9: When I select from 5 to 15 text in "Address" field
 * Example #10: When we select from 0 to 3 text in "Phone" field
 *
 * Advanced:
 * Example #11: Select first word after fill:
 *   And  I fill in "Title" with "Release 2.0 notes"
 *   When I select from 0 to 7 text in "Title" field
 * Example #12: Select middle substring by index range:
 *   And  I fill in "Body" with "abcdefghij"
 *   When I select from 3 to 6 text in "Body" field
 * Example #13: Chain — fill, focus, range-select, assert focus:
 *   And  I fill in "Notes" with "hello world"
 *   When I move focus to "Notes" field
 *   And  I select from 0 to 5 text in "Notes" field
 *   Then I see Notes has focus
 */
When(/^(I |we )*select from (\d+) to (\d+) text in "([^"]*)" field$/, async function (pronounCase, from, to, fieldLabel) {
  const start = parseInt(from, 10);
  const end   = parseInt(to, 10);
  const loc = resolveField(this.page, fieldLabel);
  await loc.focus();
  await loc.evaluate((el, [s, e]) => {
    if (typeof el.setSelectionRange === 'function') el.setSelectionRange(s, e);
  }, [start, end]);
});

/**
 * Select a specific substring of text inside a field.
 *
 * Example #1: When I select "title name" text in "Title" field
 * Example #2: When I select "some content" text in "Description" field
 * Example #3: When I select "hello" text in "Body" field
 * Example #4: When I select "admin" text in "Username" field
 * Example #5: When I select "example" text in "Email" field
 * Example #6: When we select "webship" text in "Search" field
 * Example #7: When select "lorem" text in "Notes" field
 * Example #8: When I select "street" text in "Address" field
 * Example #9: When we select "555" text in "Phone" field
 * Example #10: When I select "summary" text in "Message" field
 */
When(/^(I |we )*select "([^"]*)" text in "([^"]*)" field$/, async function (pronounCase, selectedText, fieldLabel) {
  const loc = resolveField(this.page, fieldLabel);

  const value = await loc.inputValue();
  const start = value.indexOf(selectedText);
  if (start === -1) throw new Error(`Text "${selectedText}" not found in field "${fieldLabel}"`);
  const end = start + selectedText.length;

  await loc.focus();
  await loc.evaluate((el, [s, e]) => {
    if (typeof el.setSelectionRange === 'function') el.setSelectionRange(s, e);
  }, [start, end]);
});

// ===========================================================================
// STEP DEFINITIONS — Click by named component/selector
// ===========================================================================

/**
 * Click one or more named components — uses locator.click() which auto-scrolls.
 *
 * Example #1: When I click nav
 * Example #2: When I click search button
 * Example #3: When click cta
 * Example #4: When I click on logo
 * Example #5: When I click menu
 * Example #6: When I click on submit button
 * Example #7: When I click close button
 * Example #8: When click back button
 * Example #9: When I click on forward button
 * Example #10: When I click hero, cta
 *
 * Advanced:
 * Example #11: Click via XPath-registered selector:
 *   When I add "login link xp" selector for "//a[contains(.,'Login')]" xpath selector
 *   And  I click login link xp
 * Example #12: Click a sequence — comma-separated names:
 *   Given I define css selectors:
 *     | tab 1 | [data-tab='1'] |
 *     | tab 2 | [data-tab='2'] |
 *   When  I click tab 1, tab 2
 * Example #13: Register with CSS then click — no components needed:
 *   When I add "cta primary" selector for ".cta .btn-primary" css selector
 *   And  I click cta primary
 */
When(/^(I |we )*click (?:on |a )?([a-zA-Z0-9 ,\-]+)$/, async function (pronounCase, subjectsText) {
  const names = parseNames(subjectsText);
  const errors = [];
  for (const name of names) {
    const sel = resolveSelector(this, name);
    try { await this.page.locator(sel).first().click(); }
    catch (e) { errors.push(`Cannot click "${name}" (${sel}): ${e.message}`); }
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));
});
