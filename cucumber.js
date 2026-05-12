module.exports = {
  default: {
    timeout: 30000,
    // tsx/cjs registers a require() hook so cucumber-js can load both
    // `.js` and `.ts` step files with zero build step. If you ship only
    // JavaScript, drop `requireModule` and the `.ts` half of the glob.
    requireModule: ['tsx/cjs'],
    require: [
      'tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.ts',
      'tests/step-definitions-diffy/**/*.js',
      'tests/step-definitions-diffy/**/*.ts',
    ],
    paths: ['tests/features/**/*.feature'],
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
        // Relative-position scroll offset (px) — WEBSHIP_SELECTORS_OFFSET
        offset: 60,
        // Viewport breakpoints — WEBSHIP_SELECTORS_BREAKPOINTS (JSON string)
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
      diffy: {
        apiKey: 'mock-key',                          // DIFFY_API_KEY
        projectId: 1,                                // DIFFY_PROJECT_ID
        breakpoints: '640,1200',                     // DIFFY_BREAKPOINTS
        windowHeight: 2000,                          // DIFFY_WINDOW_HEIGHT
        screenshotsDir: '',                          // DIFFY_SCREENSHOTS_DIR
        baseUrl: 'http://127.0.0.1:3099/',           // DIFFY_API_BASE_URL (mock server)
        maxWait: 30,                                 // DIFFY_MAX_WAIT (seconds)
        env1Url: '',                                 // DIFFY_ENV1_URL (custom env)
        env2Url: '',                                 // DIFFY_ENV2_URL (custom env)
      },
    },
  },
};
