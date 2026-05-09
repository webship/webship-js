
# Then create diffy comparison with name "value"

## Description
This step definition creates a named Diffy comparison using the last two uploaded snapshots.

## Gherkin Pattern
```
Then (I |we )*create diffy comparison with name "([^"]*)"
```

## Examples
- `Then create diffy comparison with name "release-2.0"`
- `Then create diffy comparison with name "nightly"`
- `Then create diffy comparison with name "smoke-run-42"`
- `Then create diffy comparison with name "webship.co-regression"`
- `Then create diffy comparison with name "before-vs-after"`
- `Then create diffy comparison with name "homepage-baseline-vs-changed"`

## Parameters
The step accepts a single parameter: a string value representing the name for the comparison being created.
