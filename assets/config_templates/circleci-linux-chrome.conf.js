const Services = {}; loadServices();

module.exports = {
  // An array of folders (excluding subfolders) where your tests are located;
  // if this is not specified, the test source must be passed as the second argument to the test runner.
  src_folders: ['tests/step-definitions'],

   // See https://nightwatchjs.org/guide/extending-nightwatch/adding-custom-commands.html
   custom_commands_path: './lib/custom-commands',

   // See https://nightwatchjs.org/guide/extending-nightwatch/adding-custom-assertions.html
   custom_assertions_path: './lib/custom-assertions',

  test_runner: {
    type: 'cucumber',
    options: {
      feature_path: 'tests/features/*.feature',
      additional_config: '',
      parallel: 1,
      'format-options': JSON.stringify({
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
      }),
    },
  },
  globals: {
    assets_folder : "/test/assets/",
    minimum_wait_time: {
      page: 3000,
      before_scenario: 0,
      after_scenario: 0,
      before_step: 0,
      after_step: 1000
    }
  },
  test_settings: {
    default: {
      launch_url: 'http://localhost:8080/',
      start_process: true,
      selenium_port: 4444,
      selenium_host: '127.0.0.1',
      silent: true,
      output: false,
      screenshots: {
        enabled: false,
        path: './reports/screenshots',
      },

      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          // More info on Chromedriver: https://sites.google.com/a/chromium.org/chromedriver/
          //
          // w3c:false tells Chromedriver to run using the legacy JSONWire protocol (not required in Chrome 78)
          w3c: true,
          args: [
            '--headless',
            '--start-maximized',
            '--disable-gpu',
            '--window-size=1600,1200',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--DNS-prefetch-disable',
            '--disable-translate',
            '--ignore-certificate-errors',
            '--test-type',
            '--disable-extensions',
            '--incognito',
            '--disable-infobars',
            '--remote-debugging-port=9222',
            '--allowed-ips=*',
            '--whitelisted-ips=*',
            '--allow-insecure-localhost',
          ],
        },
      },
    },
  },

  selenium_server: {
    // Selenium Server is running locally and is managed by Nightwatch
    selenium: {
      start_process: true,
      port: 4444,
      server_path: (Services.seleniumServer ? Services.seleniumServer.path : ''),
      cli_args: {
        'webdriver.gecko.driver': (Services.geckodriver ? Services.geckodriver.path : ''),
        'webdriver.chrome.driver': (Services.chromedriver ? Services.chromedriver.path : ''),
      },
    },

    webdriver: {
      start_process: false
    },
  },

  'selenium.chrome': {
    extends: 'selenium',
    desiredCapabilities: {
      browserName: 'chrome',
      chromeOptions: {
        w3c: false,
      },
    },
  }
};

function loadServices() {
  try {
    Services.seleniumServer = require('selenium-server');
  } catch (err) {}

  try {
    Services.chromedriver = require('chromedriver');
  } catch (err) {}

  try {
    Services.geckodriver = require('geckodriver');
  } catch (err) {}
}