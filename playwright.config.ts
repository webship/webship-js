import type { LaunchOptions, BrowserContextOptions } from 'playwright';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const browser = (process.env.BROWSER || 'chromium') as BrowserName;

// No --disable-web-security: it turns off the same-origin policy a visitor's
// browser has, and Chromium then sends a same-origin POST without its Origin
// header, so a site that checks the origin of a form (SvelteKit's form
// actions, Rails' default check) refuses it. Playwright reaches the elements
// of a cross-origin frame without it.
const chromiumArgs: string[] = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--ignore-certificate-errors',
  '--disable-extensions',
  '--incognito',
  '--disable-infobars',
  '--start-maximized',
];

interface PlaywrightConfig {
  browser: BrowserName;
  launchOptions: LaunchOptions;
  contextOptions: BrowserContextOptions;
}

const config: PlaywrightConfig = {
  browser,
  launchOptions: {
    headless: process.env.HEADLESS !== 'false',
    // Pause before every browser action, in ms: 300 by default, 800 with
    // HEADLESS=false so a headed run can be watched. SLOW_MO wins over both:
    // SLOW_MO=0 for full speed (npm run test:fast), in CI too.
    slowMo: parseInt(process.env.SLOW_MO || (process.env.HEADLESS === 'false' ? '800' : '300'), 10),
    args: browser === 'chromium' ? chromiumArgs : [],
  },
  contextOptions: {
    viewport: null,
    ignoreHTTPSErrors: true,
  },
};

export = config;
