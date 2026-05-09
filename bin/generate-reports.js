#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const reporter = require('cucumber-html-reporter');

const THEMES = new Set(['bootstrap', 'hierarchy', 'foundation', 'simple']);
const FORMATS = new Set(['html', 'pdf', 'all']);
const PDF_FORMATS = new Set(['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']);

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function parseArgs(argv) {
  const opts = {
    metadata: {},
    scenarioTimestamp: true,
    reportSuiteAsScenarios: true,
    failedSummaryReport: true,
    launchReport: false,
    noInlineScreenshots: false,
    storeScreenshots: false,
    ignoreBadJsonFile: false,
    formats: [],
    pdfFormat: 'A4',
    pdfLandscape: false,
    pdfMargin: '20mm',
    pdfPrintBackground: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '-h':
      case '--help':          opts.help = true; break;
      case '--json':          opts.jsonFile = next(); break;
      case '--out':
      case '--output':        opts.output = next(); break;
      case '--theme':         opts.theme = next(); break;
      case '--title':         opts.brandTitle = next(); break;
      case '--name':          opts.name = next(); break;
      case '--launch':        opts.launchReport = true; break;
      case '--layout':        opts.columnLayout = Number(next()); break;
      case '--no-scenario-timestamp':    opts.scenarioTimestamp = false; break;
      case '--no-suite-as-scenarios':    opts.reportSuiteAsScenarios = false; break;
      case '--no-failed-summary':        opts.failedSummaryReport = false; break;
      case '--no-inline-screenshots':    opts.noInlineScreenshots = true; break;
      case '--store-screenshots':        opts.storeScreenshots = true; break;
      case '--screenshots-dir':          opts.screenshotsDirectory = next(); break;
      case '--ignore-bad-json':          opts.ignoreBadJsonFile = true; break;
      case '--app-version':   opts.metadata['App Version'] = next(); break;
      case '--env':           opts.metadata['Test Environment'] = next(); break;
      case '--browser':       opts.metadata['Browser'] = next(); break;
      case '--platform':      opts.metadata['Platform'] = next(); break;
      case '--parallel':      opts.metadata['Parallel'] = next(); break;
      case '--executed':      opts.metadata['Executed'] = next(); break;
      case '--format': {
        const f = (next() || '').toLowerCase();
        if (!FORMATS.has(f)) {
          console.error(`[webship-js] Unknown format "${f}". Use: ${[...FORMATS].join(', ')}`);
          process.exit(1);
        }
        if (f === 'all') opts.formats.push('html', 'pdf');
        else opts.formats.push(f);
        break;
      }
      case '--pdf-out':            opts.pdfOut = next(); break;
      case '--pdf-format':         opts.pdfFormat = next(); break;
      case '--pdf-landscape':      opts.pdfLandscape = true; break;
      case '--pdf-margin':         opts.pdfMargin = next(); break;
      case '--pdf-no-background':  opts.pdfPrintBackground = false; break;
      case '--pdf-header':         opts.pdfHeaderTemplate = next(); break;
      case '--pdf-footer':         opts.pdfFooterTemplate = next(); break;
      case '--pdf-scale':          opts.pdfScale = Number(next()); break;
      case '--metadata': {
        const kv = next() || '';
        const eq = kv.indexOf('=');
        if (eq > 0) opts.metadata[kv.slice(0, eq)] = kv.slice(eq + 1);
        break;
      }
      default:
        if (a.startsWith('--')) {
          console.error(`[webship-js] Unknown option: ${a}`);
          opts.help = true;
        }
    }
  }
  if (opts.formats.length === 0) opts.formats = ['html'];
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: generate-reports [options]',
      '',
      'Generate HTML / PDF report from cucumber JSON output.',
      '',
      'Input / Output:',
      '  --json <path>         JSON input  (env WEBSHIP_REPORT_JSON,',
      '                        default: tests/reports/cucumber_report.json)',
      '  --out <path>          HTML output (env WEBSHIP_REPORT_OUT,',
      '                        default: tests/reports/cucumber_report.html)',
      '  --format <kind>       html | pdf | all  (repeatable)',
      '                        default: html',
      '',
      'PDF options (require --format pdf or all):',
      '  --pdf-out <path>      PDF output (default: <out>.pdf)',
      '  --pdf-format <name>   Letter | Legal | A3 | A4 | A5 | …  (default: A4)',
      '  --pdf-landscape       Landscape orientation',
      '  --pdf-margin <css>    Margin all sides (default: 20mm)',
      '  --pdf-no-background   Disable print background colors / images',
      '  --pdf-header <html>   Header template HTML',
      '  --pdf-footer <html>   Footer template HTML',
      '  --pdf-scale <n>       Scale factor 0.1-2.0',
      '',
      'Format:',
      '  --theme <name>        bootstrap | hierarchy | foundation | simple',
      '                        (env WEBSHIP_REPORT_THEME, default: bootstrap)',
      '  --title <s>           Brand title (env WEBSHIP_REPORT_TITLE)',
      '  --name <s>            Report name',
      '  --layout <1|2>        Column layout (default: 1)',
      '  --launch              Launch report in browser after generation',
      '  --no-scenario-timestamp   Hide per-scenario timestamp',
      '  --no-suite-as-scenarios   Report suites instead of scenarios',
      '  --no-failed-summary       Hide failed-scenarios summary',
      '  --no-inline-screenshots   Link screenshots instead of embedding',
      '  --store-screenshots       Copy screenshots into report dir',
      '  --screenshots-dir <dir>   Source screenshots directory',
      '  --ignore-bad-json         Do not fail on malformed JSON entries',
      '',
      'Metadata:',
      '  --app-version <s>     App Version         (env WEBSHIP_REPORT_APP_VERSION)',
      '  --env <s>             Test Environment    (env WEBSHIP_REPORT_ENV)',
      '  --browser <s>         Browser             (env BROWSER)',
      '  --platform <s>        Platform            (default: process.platform)',
      '  --parallel <s>        Parallel            (default: Scenarios)',
      '  --executed <s>        Executed            (env WEBSHIP_REPORT_EXECUTED)',
      '  --metadata key=value  Arbitrary key/value (repeatable)',
      '',
      '  -h, --help            Show this help',
      '',
      'Examples:',
      '  generate-reports',
      '  generate-reports --format pdf --pdf-format Letter --pdf-landscape',
      '  generate-reports --format all --launch',
      '',
    ].join('\n')
  );
}

async function generatePdf(htmlPath, pdfPath, args) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (err) {
    throw new Error(
      'PDF generation requires "playwright". Run `npm install playwright` and try again.\n' +
      `Original error: ${err.message}`
    );
  }
  if (!PDF_FORMATS.has(args.pdfFormat)) {
    throw new Error(`Unknown --pdf-format "${args.pdfFormat}". Use: ${[...PDF_FORMATS].join(', ')}`);
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const fileUrl = 'file://' + path.resolve(htmlPath);
    // The cucumber-html-reporter output references CDN scripts that may
    // never settle; use `domcontentloaded` and add a short render delay.
    // `commit` returns once navigation accepts; safer than domcontentloaded
    // when the report references third-party CDN assets that may stall.
    await page.goto(fileUrl, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // Render exactly what is shown on screen (preserves badges, panels,
    // gradients). The `print` media flips to greyscale on many themes.
    await page.emulateMedia({ media: 'screen' });

    // Force-expand every collapsed feature/scenario block and apply
    // print-friendly styles so the PDF shows ALL steps without clipping.
    await page.addStyleTag({ content: `
      /* Preserve every color (status badges, panels, charts) when printing. */
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @media print {
        .collapse, .panel-collapse, [aria-expanded="false"] + .collapse,
        .collapse.in, .collapse.show, .collapsing {
          display: block !important;
          visibility: visible !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          opacity: 1 !important;
        }
        .feature, .feature-container, .scenario, .scenario-container,
        .row.steps, .step, .features-summary { page-break-inside: avoid; }
        .feature, .feature-container { page-break-before: auto; }
        details { display: block !important; } details > * { display: block !important; }
        a[href]:after { content: ""; }
        .btn, button.collapse-toggle, .toggle-icon, .glyphicon-chevron-right,
        .glyphicon-chevron-down { display: none !important; }
        pre, code { white-space: pre-wrap !important; word-wrap: break-word !important; }
        img { max-width: 100% !important; height: auto !important; }
      }
      .collapse { display: block !important; height: auto !important; }
      .collapsing { transition: none !important; }
      details:not([open]) { }
    ` });

    // Flatten the report: kill every script, expand every panel, neutralise
    // every collapse trigger so the resulting PDF is static. No JS runs at
    // PDF time — what you see is exactly what gets rendered.
    await page.evaluate(() => {
      document.querySelectorAll('script').forEach(s => s.remove());
      document.querySelectorAll('[data-toggle], [data-bs-toggle]').forEach(el => {
        el.removeAttribute('data-toggle');
        el.removeAttribute('data-bs-toggle');
        el.removeAttribute('data-target');
        el.removeAttribute('data-bs-target');
        el.removeAttribute('href');
        el.style.cursor = 'default';
      });
      document.querySelectorAll('.collapse, .panel-collapse, [class*="collapse"]').forEach(el => {
        el.classList.add('in', 'show');
        el.classList.remove('collapsing');
        el.style.cssText += ';height:auto !important;display:block !important;visibility:visible !important;opacity:1 !important;';
        el.setAttribute('aria-expanded', 'true');
      });
      document.querySelectorAll('[aria-expanded]').forEach(el => el.setAttribute('aria-expanded', 'true'));
      document.querySelectorAll('details').forEach(el => el.setAttribute('open', ''));
      document.querySelectorAll('.glyphicon-chevron-right').forEach(el => {
        el.classList.remove('glyphicon-chevron-right');
        el.classList.add('glyphicon-chevron-down');
      });
    });
    await page.waitForTimeout(300);
    const opts = {
      path: pdfPath,
      format: args.pdfFormat,
      landscape: !!args.pdfLandscape,
      printBackground: args.pdfPrintBackground,
      margin: {
        top: args.pdfMargin,
        right: args.pdfMargin,
        bottom: args.pdfMargin,
        left: args.pdfMargin,
      },
    };
    if (args.pdfHeaderTemplate || args.pdfFooterTemplate) {
      opts.displayHeaderFooter = true;
      if (args.pdfHeaderTemplate) opts.headerTemplate = args.pdfHeaderTemplate;
      if (args.pdfFooterTemplate) opts.footerTemplate = args.pdfFooterTemplate;
    }
    if (Number.isFinite(args.pdfScale)) opts.scale = args.pdfScale;
    await page.pdf(opts);
  } finally {
    await browser.close();
  }
}

async function run(argv) {
  const args = parseArgs(argv);
  if (args.help) return printHelp();

  const cwd = process.cwd();
  const jsonFile = path.resolve(
    cwd,
    args.jsonFile ||
      process.env.WEBSHIP_REPORT_JSON ||
      'tests/reports/cucumber_report.json'
  );
  const output = path.resolve(
    cwd,
    args.output ||
      process.env.WEBSHIP_REPORT_OUT ||
      'tests/reports/cucumber_report.html'
  );

  const theme =
    args.theme || process.env.WEBSHIP_REPORT_THEME || 'bootstrap';
  if (!THEMES.has(theme)) {
    console.error(
      `[webship-js] Unknown theme "${theme}". Use one of: ${[...THEMES].join(', ')}`
    );
    process.exit(1);
  }

  const metadata = {
    'App Version':
      args.metadata['App Version'] ||
      process.env.WEBSHIP_REPORT_APP_VERSION ||
      '2.0.0',
    'Test Environment':
      args.metadata['Test Environment'] ||
      process.env.WEBSHIP_REPORT_ENV ||
      'development',
    Browser:
      args.metadata['Browser'] ||
      (process.env.BROWSER ? capitalize(process.env.BROWSER) : 'Chromium'),
    Platform: args.metadata['Platform'] || process.platform,
    Parallel: args.metadata['Parallel'] || 'Scenarios',
    Executed:
      args.metadata['Executed'] ||
      process.env.WEBSHIP_REPORT_EXECUTED ||
      'Remote',
  };
  for (const [k, v] of Object.entries(args.metadata)) {
    metadata[k] = v;
  }

  const wantHtml = args.formats.includes('html');
  const wantPdf  = args.formats.includes('pdf');
  const needsHtmlForExport = wantPdf;

  const options = {
    theme,
    jsonFile,
    output,
    reportSuiteAsScenarios: args.reportSuiteAsScenarios,
    scenarioTimestamp: args.scenarioTimestamp,
    launchReport: args.launchReport && wantHtml,
    brandTitle:
      args.brandTitle || process.env.WEBSHIP_REPORT_TITLE || 'Test Report',
    name: args.name || process.env.WEBSHIP_REPORT_NAME,
    columnLayout: args.columnLayout || 1,
    noInlineScreenshots: args.noInlineScreenshots,
    storeScreenshots: args.storeScreenshots,
    screenshotsDirectory: args.screenshotsDirectory,
    ignoreBadJsonFile: args.ignoreBadJsonFile,
    failedSummaryReport: args.failedSummaryReport,
    metadata,
  };

  if (wantHtml || needsHtmlForExport) {
    reporter.generate(options);
    console.log(`[webship-js] HTML report → ${output}`);
  }

  if (wantPdf) {
    const pdfOut = path.resolve(cwd, args.pdfOut || output.replace(/\.html?$/i, '') + '.pdf');
    await generatePdf(output, pdfOut, args);
    console.log(`[webship-js] PDF report  → ${pdfOut}`);
  }

}

if (require.main === module) {
  Promise.resolve(run(process.argv.slice(2))).catch(err => {
    console.error(`[webship-js] ${err.message || err}`);
    process.exit(1);
  });
}

module.exports = { run };
