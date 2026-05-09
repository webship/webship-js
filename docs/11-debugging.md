# Debugging

When a scenario fails, you have several layers of evidence to inspect.

## Auto-screenshot on failure

Every failed step automatically writes a screenshot under `screenshots/` with a timestamped filename. Configure in `cucumber.js`:

```js
worldParameters: {
  screenshot: {
    dir: './screenshots',
    onFailed: true,
    failedPrefix: 'failed_',
    filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
    filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
  }
}
```

Override per-run via env vars:

| Variable | Effect |
| --- | --- |
| `WEBSHIP_SCREENSHOT_DIR` | Output directory |
| `WEBSHIP_SCREENSHOT_PURGE` | `1` to wipe `dir` at the start of the run |
| `WEBSHIP_SCREENSHOT_ON_FAILED` | `0` to disable failure screenshots |
| `WEBSHIP_SCREENSHOT_ON_EVERY_STEP` | `1` to screenshot every step |
| `WEBSHIP_SCREENSHOT_FULLSCREEN` | `1` to always full-page |

## Headed mode

```bash
HEADLESS=false SLOW_MO=800 npm test
# or
npm run test:headed
```

Browser opens, every action is delayed by `SLOW_MO` ms so you can watch.

## Console + page errors

JS errors surface in two ways:

1. **Always tracked** — every scenario captures `pageerror` and `console.error`. Inspect inside a custom step via `this._jsErrors`.
2. **Auto-fail** — tag a scenario `@javascript` to assert "no errors" at scenario end. Suppress with `@js-errors`.

Explicit assertion at any point:

```gherkin
Then there should be no JavaScript errors
```

## HTML / PDF report

After every run, `tests/reports/cucumber_report.html` is regenerated. Open it for a clickable summary of features, scenarios, durations, screenshots, and per-step output.

Disable: `WEBSHIP_REPORT_DISABLE=1`.

### Export to PDF

```bash
# HTML + PDF in one shot
npx generate-reports --format all

# PDF only — Letter, landscape, slim margin
npx generate-reports --format pdf --pdf-format Letter --pdf-landscape --pdf-margin 10mm

# Branded PDF with header / footer
npx generate-reports --format pdf \
  --pdf-header '<div style="font-size:10px;width:100%;text-align:center;">Acme Q3 Regression</div>' \
  --pdf-footer '<div style="font-size:10px;width:100%;text-align:center;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>'
```

| Flag | Purpose |
| --- | --- |
| `--format html\|pdf\|all` | Repeatable. Default `html`. |
| `--pdf-format` | `Letter`, `Legal`, `A3`, `A4`, `A5`, … (default `A4`) |
| `--pdf-landscape` | Landscape orientation |
| `--pdf-margin` | CSS margin for all sides (default `20mm`) |
| `--pdf-header` / `--pdf-footer` | HTML templates (use `<span class="pageNumber">` / `<span class="totalPages">`) |
| `--pdf-no-background` | Disable print backgrounds |
| `--pdf-scale` | Scale factor 0.1–2.0 |
| `--pdf-out` | Override PDF output path |

PDF generation uses Playwright (already installed) — no extra setup. Every panel auto-expanded and colors preserved (`print-color-adjust: exact`).

## Scenario timing

```bash
time npx cucumber-js
```

For per-scenario breakdown, parse the JSON report:

```bash
node -e "
const r = require('./tests/reports/cucumber_report.json');
const s = [];
r.forEach(f => f.elements.forEach(sc => {
  const ms = sc.steps.reduce((a,b)=>a+(b.result?.duration||0),0)/1e6;
  s.push({n: sc.name, ms});
}));
s.sort((a,b)=>b.ms-a.ms).slice(0,10).forEach(x =>
  console.log(x.ms.toFixed(0).padStart(6), 'ms', x.n));
"
```

## Trace viewer

Webship-js does not enable Playwright traces by default (they are heavy). To opt in for a single run, edit `playwright.config.ts`:

```ts
contextOptions: {
  ...,
  recordVideo: { dir: './videos' },
  // tracing requires manual start/stop in a hook — see Playwright docs.
}
```

## Common diagnoses

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Passes locally, fails in CI | Timing | Use web-first assertion or edge wait |
| Flickering — sometimes passes | Race condition | `wait for "selector" to appear` instead of `wait Ns` |
| `Modal dialog is visible, but it should not be` | Stale modal selector | Register a `modal` selector in your CMS preset |
| `page.goto: net::ERR_CONNECTION_REFUSED` | Dev server not started | `npm start` in another terminal |
| `function has 0 arguments, should have 3` | Step regex captures missing in callback | Add the captured group params in the callback signature |
