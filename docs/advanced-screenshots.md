
# Advanced Screenshots

## Overview

This documentation page covers screenshot capture functionality in Webship JS 2.0.x. The feature enables testers to capture PNG screenshots during Cucumber scenarios using Playwright, supporting fullscreen, custom viewport, and named captures.

## Key Features

**Auto-capture hooks** activate screenshots in two scenarios:
- On failed steps (with `failedPrefix` prepended); the screenshot of a failed step is also attached to that step in the JSON report, so the HTML report shows it
- On every step when scenarios are tagged `@screenshots`

**Filename tokens** can be used in `with name "..."` steps or configuration keys like `filenamePattern` and `filenamePatternFailed`.

A named screenshot writes `<name>.png` and `<name>.html`. A name that already ends with `.png`, `.jpg`, `.jpeg` or `.html` keeps that one extension: `with name "homepage.png"` writes `homepage.png` and `homepage.html`.

## Configuration

Settings reside in `cucumber.js` under `worldParameters.screenshot`. Each key accepts environment variable overrides:

```javascript
worldParameters: {
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
  },
}
```

## Priority Chain

1. Environment variables (`WEBSHIP_SCREENSHOT_*`)
2. cucumber.js project defaults
3. Built-in defaults

## Output

Each capture generates two files:
- `.png` — Screenshot via Playwright
- `.html` — Raw page HTML with optional metadata

## Sub-pages

- [Then I save "width" x "height" screenshot](/docs/webship-js/2.0.x/advanced-screenshots/then-i-save-width-x-height-screenshot)
- [Then I save fullscreen screenshot](/docs/webship-js/2.0.x/advanced-screenshots/then-i-save-fullscreen-screenshot)
- [When I save screenshot with name "filename"](/docs/webship-js/2.0.x/advanced-screenshots/when-i-save-screenshot-name-filename)
