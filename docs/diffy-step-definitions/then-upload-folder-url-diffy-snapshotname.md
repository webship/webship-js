
# Then upload folder "URL" to diffy as "snapshotName"

## Description

This step uploads all PNG and WebP images from a local directory to Diffy as a named custom snapshot. The breakpoint dimensions are extracted from image width metadata, while the URL slug is determined from the filename.

## Gherkin Pattern

```
Then (I |we )*upload folder "([^"]*)" to diffy as "([^"]*)"
```

## Examples

```gherkin
Then upload folder "./screenshots/baseline" to diffy as "baseline"
Then upload folder "./screenshots/changed" to diffy as "changed"
Then upload folder "./reports/screenshots" to diffy as "nightly"
Then upload folder "/tmp/webship-shots" to diffy as "webship.co-snapshot"
Then upload folder "./out/homepage" to diffy as "homepage-release-2.0"
Then upload folder "./diffy/before" to diffy as "before-deploy"
```

## Parameters

- **Folder Path**: Local directory containing PNG/WebP files (required)
- **Snapshot Name**: Label for the uploaded custom snapshot in Diffy (required)
