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
