# tests/reports

Generated test artefacts land here. Everything in this directory **except this
README** is gitignored — these files are produced fresh on every run.

## What gets written

| File | Producer | When |
| --- | --- | --- |
| `cucumber_report.json` | `cucumber-js` (default `format` in `cucumber.js`) | Every run |
| `cucumber_report.html` | `cucumber-html-reporter` (auto-invoked at run end) | Every run |
| `cucumber_report.pdf`  | `bin/generate-reports.js --format pdf` | On demand |

Override paths with env vars:

| Variable | Default | Effect |
| --- | --- | --- |
| `WEBSHIP_REPORT_JSON` | `tests/reports/cucumber_report.json` | JSON output path |
| `WEBSHIP_REPORT_OUT`  | `tests/reports/cucumber_report.html` | HTML output path |
| `WEBSHIP_REPORT_DISABLE` | _unset_ | `1` to skip HTML generation |
| `WEBSHIP_REPORT_THEME` | `bootstrap` | `bootstrap` / `hierarchy` / `foundation` / `simple` |
| `WEBSHIP_REPORT_TITLE` | `Test Report` | Brand title in the HTML header |
| `WEBSHIP_REPORT_APP_VERSION` | `2.0.0` | Metadata field |
| `WEBSHIP_REPORT_ENV` | `development` | Test-environment metadata |
| `WEBSHIP_REPORT_EXECUTED` | `Remote` | Execution location metadata |

## Regenerate manually

```bash
# HTML only (re-uses the JSON from the last run)
npx generate-reports

# HTML + PDF in one shot
npx generate-reports --format all

# PDF only — Letter, landscape, slim margin
npx generate-reports --format pdf --pdf-format Letter --pdf-landscape --pdf-margin 10mm

# Branded PDF with header / footer
npx generate-reports --format pdf \
  --pdf-header '<div style="font-size:10px;width:100%;text-align:center;">Q3 Regression</div>' \
  --pdf-footer '<div style="font-size:10px;width:100%;text-align:center;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>'

# Full help
npx generate-reports --help
```

## Why these files are ignored

* They change on every run — committing them creates noise and merge conflicts.
* They are large (HTML ~3 MB, PDF ~5 MB on the full suite).
* They contain timestamps and per-machine metadata that vary by author.

If you need to share a report, attach the file to a PR / issue or upload to
your CI artefact store rather than committing it.
