module.exports = {
  default: {
    timeout: 30000,
    requireModule: ['ts-node/register'],
    require: [
      'tests/step-definitions/**/*.js',       // Default Webship-js step definitions.
      'tests/step-definitions-diffy/**/*.js', // diffy.website step definitions.
    ],
    paths: ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      colorsEnabled: true,
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
