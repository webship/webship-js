
# Then send screenshots to diffy with name "value"

## Overview
This step definition uploads all captured screenshots to Diffy as a named custom snapshot. Upon successful execution, it clears both the in-memory buffer and on-disk screenshotsDir.

## Gherkin Pattern
```
Then (I |we )*send screenshots to diffy with name "([^"]*)"
```

## Examples

```
Then send screenshots to diffy with name "baseline"
Then send screenshots to diffy with name "changed"
Then send screenshots to diffy with name "homepage-release-2.0"
Then send screenshots to diffy with name "after-deploy"
Then send screenshots to diffy with name "smoke-run"
Then send screenshots to diffy with name "webship.co-prod"
```

## Parameters
- **name** (required): A custom snapshot identifier string passed in quotes

## Functionality
The step captures all previously taken screenshots and uploads them to Diffy with the specified snapshot name. After successful upload, it automatically clears both the internal screenshot buffer and the local screenshots directory.
