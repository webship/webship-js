// A feature file, a scenario (file:line), a folder or a rerun file named on
// the command line of cucumber-js runs alone. cucumber-js 12 adds the paths
// of the command line to the `paths` of this file instead of using them
// alone, so `paths` is left empty when the command line names any: what
// cucumber-js announces for its next major version.
const OPTIONS_WITH_A_VALUE = new Set([
  '-c', '--config', '-f', '--format', '--format-options', '--i18n-keywords',
  '-i', '--import', '-l', '--loader', '--language', '--name', '--order',
  '-p', '--profile', '--parallel', '--plugin', '--plugin-options',
  '-r', '--require', '--require-module', '--retry', '--retry-tag-filter',
  '--shard', '-t', '--tags', '--world-parameters',
]);

function commandLinePaths() {
  // Only when cucumber-js itself runs, not when another script reads this file.
  if (!/cucumber(-js|\.js)?$/.test(String(process.argv[1] || ''))) return [];
  const args = process.argv.slice(2);
  const paths = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('-')) {
      if (OPTIONS_WITH_A_VALUE.has(args[i])) i += 1;
    } else {
      paths.push(args[i]);
    }
  }
  return paths;
}

module.exports = {
  default: {
    // Cucumber step timeout must exceed Playwright's default 30s so the
    // try/catch wrappers in step files always see the Playwright error
    // first (and emit a friendly message) rather than cucumber's raw
    // "function timed out" stack. The step definitions call
    // setDefaultTimeout() on load, which wins over this value — raise it
    // with WEBSHIP_STEP_TIMEOUT instead.
    timeout: 45000,
    // tsx/cjs registers a require() hook so cucumber-js can load both
    // `.js` and `.ts` step files with zero build step. If you ship only
    // JavaScript, drop `requireModule` and the `.ts` half of the glob.
    requireModule: ['tsx/cjs'],
    require: [
      'tests/step-definitions/**/*.js',
    ],
    paths: commandLinePaths().length ? [] : ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      // Color toggle is controlled via the FORCE_COLOR env var (per
      // cucumber-js v10+); the deprecated `colorsEnabled` option is gone.
      theme: {
        'feature keyword': ['bold', 'blue'],
        'feature name': ['blue', 'underline'],
        'feature description': ['blueBright'],
        'scenario keyword': ['bold', 'magenta'],
        'scenario name': ['magenta', 'underline'],
        'step keyword': ['bold', 'green'],
        'step text': ['greenBright', 'italic'],
      },
    },
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost:8080',
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        // Named CSS selectors — layout components and element locators in one registry.
        // Register inline: When I add "name" selector for "css" css selector
        // Or in bulk:      Given I define css selectors:
        //                    | name | css selector |
        css: {
          // 'header':                'header.page-header',
          // 'main nav':              'nav[role="navigation"]',
          // 'breadcrumb':            '.breadcrumb',
          // 'breadcrumb first link': '.breadcrumb li:nth-child(1) a',
          // 'message':               '.messages',
          // 'error message':         '.messages.error',
          // 'success message':       '.messages.status',
          // 'warning message':       '.messages.warning',
        },
        // Named XPath selectors — use with: When I add "name" selector for "xpath" xpath selector
        xpath: {
          // 'page title': '//h1[contains(@class,"page-header")]',
        },
        // Load additional selectors from JSON files at scenario start.
        filesPath: './tests/selectors/',             // base path for selector files
        files: [],                                   // e.g. ['homepage-selectors.json'] or ['front-end-selectors.json', 'back-end-selectors.json']
        // Named viewport sizes for every step and tag that names one (viewing
        // the site on a … screen, set the viewport to the "…" breakpoint,
        // @mobile, @desktop). Built in: xs..xxxl, mobile, tablet, desktop;
        // these replace or add names. WEBSHIP_SELECTORS_BREAKPOINTS (a JSON
        // object) is merged over them. Without a `desktop` here, @desktop
        // opens at the breakpoint marked default: true.
        breakpoints: {
          xs:   { width: 375,  height: 667  },                    // phone portrait
          sm:   { width: 576,  height: 800  },                    // large phone / phablet
          md:   { width: 768,  height: 1024 },                    // tablet portrait
          lg:   { width: 992,  height: 768  },                    // small laptop / tablet landscape
          xl:   { width: 1200, height: 900, default: true },      // desktop
          xxl:  { width: 1400, height: 900  },                    // wide desktop / HD
          xxxl: { width: 1920, height: 1080 },                    // Full HD / large monitor
        },
      },
      screenshot: {
        dir: './screenshots',                        // WEBSHIP_SCREENSHOT_DIR
        purge: false,                                // WEBSHIP_SCREENSHOT_PURGE
        onFailed: true,                              // WEBSHIP_SCREENSHOT_ON_FAILED
        onEveryStep: false,                          // WEBSHIP_SCREENSHOT_ON_EVERY_STEP
        alwaysFullscreen: false,                     // WEBSHIP_SCREENSHOT_FULLSCREEN
        failedPrefix: 'failed_',                     // WEBSHIP_SCREENSHOT_FAILED_PREFIX
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}', // WEBSHIP_SCREENSHOT_PATTERN
        filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}', // WEBSHIP_SCREENSHOT_PATTERN_FAIL
        infoTypes: '',                               // WEBSHIP_SCREENSHOT_INFO_TYPES  e.g. "url,feature,step,datetime"
      },
      video: {
        // Record the browser as a webm video.
        //   'off' (default) — no recording, except scenarios tagged @video.
        //   'on'            — record every scenario.
        //   'on-failure'    — record every scenario, keep only failures (and
        //                     the videos of @video scenarios or with a name
        //                     reserved by "I save the current video as").
        //   'tag'           — the same as 'off': only scenarios tagged @video.
        // Override per scenario with tags:
        //   @video    — force recording on (in every mode).
        //   @no-video — suppress recording for this scenario.
        // Override per run with env: WEBSHIP_VIDEO.
        mode: 'off',                                 // WEBSHIP_VIDEO
        dir: './videos',                             // WEBSHIP_VIDEO_DIR
        size: { width: 1280, height: 720 },          // WEBSHIP_VIDEO_SIZE  e.g. "1280x720"
        // Filename template tokens: {datetime} (when the recording started)
        // {feature_file} {feature} {scenario} {status} (passed, failed, … in
        // lower case; "manual" for a recording stopped by a step) {ext}.
        // Sanitised to filesystem-safe characters.
        filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
      },
      javascript: {
        // How to report collected JavaScript errors at scenario end.
        //   'warn' (default) — log a yellow warning, scenario still passes.
        //   'fail'           — fail the scenario.
        //   'off'            — silent.
        // Override per scenario with tags: @js-fail, @js-warn, @js-off.
        // Override per run with env: WEBSHIP_JS_ERROR_MODE.
        mode: 'warn',                                // WEBSHIP_JS_ERROR_MODE
        // Console levels to capture in addition to `pageerror`.
        // Common: ['error'], ['error','warning'], ['error','warning','info'].
        levels: ['error'],                           // WEBSHIP_JS_ERROR_LEVELS (csv)
        // Regex string. Errors whose message matches are ignored.
        ignore: '',                                  // WEBSHIP_JS_ERROR_IGNORE
        // Snapshot any pre-existing errors at scenario start.
        beforeScenario: false,                       // WEBSHIP_JS_ERROR_BEFORE
        // Report collected errors at scenario end (default true).
        afterScenario: true,                         // WEBSHIP_JS_ERROR_AFTER
      },
    },
  },
};
