'use strict';

const { setWorldConstructor, World, Before, After, BeforeStep, AfterStep, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(30 * 1000);
const { chromium } = require('playwright');
const path = require('path');

const LAUNCH_URL = process.env.LAUNCH_URL || 'http://localhost:8080';

const MIN_WAIT_TIME = {
  page: 3000,
  before_scenario: 0,
  after_scenario: 0,
  before_step: 0,
  after_step: 0,
};

class PlaywrightWorld extends World {
  constructor(options) {
    super(options);
    this.launchUrl = LAUNCH_URL;
    this.playwrightBrowser = null;
    this.context = null;
    this.page = null;
    this.assetsFolder = path.join(__dirname, '../assets/');
    this.minWaitTime = MIN_WAIT_TIME;
  }

  async openBrowser() {
    this.playwrightBrowser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--ignore-certificate-errors',
        '--disable-extensions',
        '--incognito',
        '--disable-infobars',
      ],
    });
    this.context = await this.playwrightBrowser.newContext({
      viewport: { width: 1600, height: 1200 },
      ignoreHTTPSErrors: true,
    });
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    if (this.playwrightBrowser) {
      await this.playwrightBrowser.close();
      this.playwrightBrowser = null;
      this.context = null;
      this.page = null;
    }
  }
}

setWorldConstructor(PlaywrightWorld);

Before(async function () {
  await this.openBrowser();
  if (this.minWaitTime.before_scenario > 0) {
    await this.page.waitForTimeout(this.minWaitTime.before_scenario);
  }
});

After(async function () {
  if (this.minWaitTime.after_scenario > 0) {
    await this.page.waitForTimeout(this.minWaitTime.after_scenario);
  }
  await this.closeBrowser();
});

BeforeStep(async function () {
  if (this.page && this.minWaitTime.before_step > 0) {
    await this.page.waitForTimeout(this.minWaitTime.before_step);
  }
});

AfterStep(async function () {
  if (this.page && this.minWaitTime.after_step > 0) {
    await this.page.waitForTimeout(this.minWaitTime.after_step);
  }
});
