#!/usr/bin/env node

'use strict';

const path = require('path');
const reporter = require('cucumber-html-reporter');

const THEMES = new Set(['bootstrap', 'hierarchy', 'foundation', 'simple']);

function bool(v) {
  return v !== 'false' && v !== '0' && v !== 'no';
}

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
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: generate-reports [options]',
      '',
      'Generate cucumber HTML report from JSON output.',
      '',
      'Input / Output:',
      '  --json <path>         JSON input  (env WEBSHIP_REPORT_JSON,',
      '                        default: tests/reports/cucumber_report.json)',
      '  --out <path>          HTML output (env WEBSHIP_REPORT_OUT,',
      '                        default: tests/reports/cucumber_report.html)',
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
    ].join('\n')
  );
}

function run(argv) {
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

  const options = {
    theme,
    jsonFile,
    output,
    reportSuiteAsScenarios: args.reportSuiteAsScenarios,
    scenarioTimestamp: args.scenarioTimestamp,
    launchReport: args.launchReport,
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

  reporter.generate(options);
}

if (require.main === module) {
  run(process.argv.slice(2));
}

module.exports = { run };
