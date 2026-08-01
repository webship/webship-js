# Global Settings

Webship-js draws settings from three layers, evaluated in this order:

1. **Environment variables** (CI / shell) — highest precedence.
2. **`worldParameters` in `cucumber.js`** — project-level defaults.
3. **Built-in defaults** — sane fallbacks shipped with the library.

This page documents every supported setting plus its env-var override.

---

## Top-level `cucumber.js` keys

| Key | Type | Default | Notes |
| --- | --- | --- | --- |
| `timeout` | int (ms) | `30000` | Per-step timeout enforced by `setDefaultTimeout`. |
| `requireModule` | array | `['ts-node/register']` | TypeScript runtime support. |
| `require` | array | step-definition globs | Files Cucumber-js loads at startup. |
| `paths` | array | `['tests/features/**/*.feature']` | Where to find feature files. |
| `format` | array | pretty + JSON report | Output formatters. |
| `formatOptions` | object | colour theme | Pretty-formatter colours. |
| `worldParameters` | object | (sections below) | Everything passed to the Playwright World. |

Single profile: `default`. Run with:

```bash
npx cucumber-js
```

To enable `parallel`, `retry`, or `retryTagFilter`, add them inside the
`default` block (or pass `--parallel N`, `--retry N`, `--retry-tag-filter @flaky`
on the command line).

---

## `worldParameters` — runtime configuration

### `launchUrl`

| Type | Default | Env override |
| --- | --- | --- |
| string | `http://localhost:8080` | `LAUNCH_URL` |

Base URL prepended to every relative path in `Given I am on "/path"`.

### `assetsFolder`

Resolved automatically to `tests/assets/`. Used by `When I attach the
file "...".`. Override per-World by extending the world constructor;
no env var.

### `minWaitTime` — pacing knobs

```js
minWaitTime: {
  page: 3000,             // ms — page-settle budget for navigation steps
  before_scenario: 0,     // ms — sleep before each Scenario starts
  after_scenario: 0,      // ms — sleep after each Scenario ends
  before_step: 0,         // ms — sleep before each Step
  after_step: 0,          // ms — sleep after each Step
}
```

| Key | Default | Purpose |
| --- | --- | --- |
| `page` | `3000` | Per-navigation budget for `smartSettle`. Bump for slow CI. |
| `before_scenario` | `0` | Forces a fixed delay before each Scenario. Default off — BBR auto-settle replaces it. |
| `after_scenario` | `0` | Same, after Scenario ends. |
| `before_step` | `0` | Per-step sleep. Use only for visual debugging. |
| `after_step` | `0` | Same, after each step. |

> Best practice: leave the four `*_scenario` / `*_step` keys at `0` —
> the BBR auto-settle hook handles real timing. Only raise them when
> demoing a recording in headed mode.

### `selectors` — named selector registry

```js
selectors: {
  css: { /* name → CSS selector */ },
  xpath: { /* name → XPath expression */ },
  filesPath: './tests/selectors/',  // base path for JSON presets
  files: [],                         // JSON files to auto-load per scenario
  offset: 60,                        // px — scroll offset for relative-position assertions
  breakpoints: {                     // viewport sizes (used by responsive.steps.js)
    xs:   { width: 375,  height: 667  },
    sm:   { width: 576,  height: 800  },
    md:   { width: 768,  height: 1024 },
    lg:   { width: 992,  height: 768  },
    xl:   { width: 1200, height: 900, default: true },
    xxl:  { width: 1400, height: 900  },
    xxxl: { width: 1920, height: 1080 },
  },
}
```

| Key | Default | Env override |
| --- | --- | --- |
| `css` | `{}` | — |
| `xpath` | `{}` | — |
| `filesPath` | `./tests/selectors/` | — |
| `files` | `[]` | — |
| `offset` | `60` | `WEBSHIP_SELECTORS_OFFSET` |
| `breakpoints` | xs..xxxl | `WEBSHIP_SELECTORS_BREAKPOINTS` (JSON string) |

### `screenshot` — capture configuration

```js
screenshot: {
  dir: './screenshots',
  purge: false,
  onFailed: true,
  onEveryStep: false,
  alwaysFullscreen: false,
  failedPrefix: 'failed_',
  filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
  filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
  infoTypes: '',
}
```

| Key | Default | Env override |
| --- | --- | --- |
| `dir` | `./screenshots` | `WEBSHIP_SCREENSHOT_DIR` |
| `purge` | `false` | `WEBSHIP_SCREENSHOT_PURGE` |
| `onFailed` | `true` | `WEBSHIP_SCREENSHOT_ON_FAILED` |
| `onEveryStep` | `false` | `WEBSHIP_SCREENSHOT_ON_EVERY_STEP` |
| `alwaysFullscreen` | `false` | `WEBSHIP_SCREENSHOT_FULLSCREEN` |
| `failedPrefix` | `failed_` | `WEBSHIP_SCREENSHOT_FAILED_PREFIX` |
| `filenamePattern` | `{datetime}...` | `WEBSHIP_SCREENSHOT_PATTERN` |
| `filenamePatternFailed` | `{failed_prefix}...` | `WEBSHIP_SCREENSHOT_PATTERN_FAIL` |
| `infoTypes` | `''` | `WEBSHIP_SCREENSHOT_INFO_TYPES` (e.g. `"url,feature,step,datetime"`) |

Filename pattern tokens: `{datetime}`, `{date}`, `{time}`, `{feature_file}`,
`{feature}`, `{scenario}`, `{step_line}`, `{ext}`, `{failed_prefix}`,
`{url}`, `{host}`, `{path}`.

### `video` — Playwright video recording

```js
video: {
  mode: 'off',                                   // WEBSHIP_VIDEO — 'off' | 'on' | 'on-failure' | 'tag'
  dir: './videos',                               // WEBSHIP_VIDEO_DIR
  size: { width: 1280, height: 720 },            // recording viewport
  filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
}
```

Tag overrides per scenario:

| Tag | Effect |
| --- | --- |
| `@video` | Force recording on. |
| `@no-video` | Suppress recording. |

Modes:

| Mode | Behaviour |
| --- | --- |
| `off` (default) | No recording. |
| `on` | Record every scenario. |
| `on-failure` | Record every scenario, keep only failures. |
| `tag` | Record only scenarios tagged `@video`. |

Mid-scenario start / stop steps live in `video.steps.js`. Recording starts at context creation only — `When I start video recording` closes + reopens the context, losing page state. Call before any navigation.

### `javascript` — page-error / console capture

```js
javascript: {
  mode: 'warn',                  // WEBSHIP_JS_ERROR_MODE — 'warn' | 'fail' | 'off'
  levels: ['error'],             // WEBSHIP_JS_ERROR_LEVELS (csv) — console levels to capture
  ignore: '',                    // WEBSHIP_JS_ERROR_IGNORE — regex of messages to drop
  beforeScenario: false,         // WEBSHIP_JS_ERROR_BEFORE — snapshot pre-existing errors
  afterScenario: true,           // WEBSHIP_JS_ERROR_AFTER — report at scenario end
}
```

Tags override `mode` per scenario:

| Tag | Effect |
| --- | --- |
| `@js-fail` / `@javascript` (legacy) | force `fail` |
| `@js-warn` | force `warn` |
| `@js-off` / `@js-errors` (legacy) | force `off` |

The explicit step `Then there should be no JavaScript errors` always asserts (independent of mode).

---

## `playwright.config.ts` — browser launch

```ts
const config = {
  browser: process.env.BROWSER || 'chromium',
  launchOptions: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '300', 10),
    args: [...],
  },
  contextOptions: {
    viewport: null,
    ignoreHTTPSErrors: true,
  },
};
```

| Key | Default | Env override |
| --- | --- | --- |
| `browser` | `chromium` | `BROWSER` (`chromium` / `firefox` / `webkit`) |
| `launchOptions.headless` | `true` | `HEADLESS=false` for headed |
| `launchOptions.slowMo` | `300` headed: `800` | `SLOW_MO` (ms) |
| `launchOptions.args` | chromium-only flags | edit file directly |
| `contextOptions.viewport` | `null` (use browser default) | edit file directly |
| `contextOptions.ignoreHTTPSErrors` | `true` | edit file directly |

---

## Behaviour toggles

| Env var | Effect |
| --- | --- |
| `WEBSHIP_AUTO_SETTLE` | Set to `off` to disable the BBR auto-settle hook (`smartSettle(page, 1500)` after every state-changing step). |
| `WEBSHIP_REPORT_DISABLE` | Set to `1` to skip auto-generating the HTML report on cucumber-js process exit. |
| `WEBSHIP_REPORT_ARGS` | Extra CLI flags forwarded to `bin/generate-reports.js`. e.g. `--theme hierarchy --layout 2`. |

---

## Run / pacing env vars

| Env var | Default | Effect |
| --- | --- | --- |
| `LAUNCH_URL` | `http://localhost:8080` | Base URL for navigation steps. |
| `BROWSER` | `chromium` | Browser engine. |
| `HEADLESS` | `true` | `false` opens a visible browser. |
| `SLOW_MO` | `300` (headed: `800`) | Per-action delay (ms). Set to `0` for fast runs. |

---

## npm scripts

| Script | Description |
| --- | --- |
| `npm test` | Default profile, full pretty output, slow-mo on. |
| `npm run test:headed` | `HEADLESS=false`. Watches the browser. |
| `npm run test:fast` | `SLOW_MO=0` on the default profile. |
| `npm run test:chromium` | `BROWSER=chromium npm test`. |
| `npm run test:firefox` | `BROWSER=firefox npm test`. |
| `npm run test:webkit` | `BROWSER=webkit npm test`. |
| `npm start` | Static dev server on port 8080 (`http-server examples`). |
| `npm run generate-reports` | Manually rebuild the HTML report from the JSON output. |

---

## Recipe — typical CI lane

```bash
LAUNCH_URL=https://staging.example.com \
SLOW_MO=0 \
BROWSER=chromium \
WEBSHIP_SCREENSHOT_PURGE=1 \
npx cucumber-js --tags "@critical and not @wip" --parallel 4 --retry 1 --retry-tag-filter @flaky
```

Translation: zero slow-mo, 4 parallel processes, retry `@flaky` once,
fresh `screenshots/` each run, only `@critical` (excluding work-in-progress).
