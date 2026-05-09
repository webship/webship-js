
# Then I take screenshots for all breakpoints

## Description

This step definition resizes the browser window to each configured breakpoint and captures a screenshot at each breakpoint. The breakpoints are sourced from the `DIFFY_BREAKPOINTS` environment variable or `worldParameters.diffy.breakpoints`.

## Gherkin Step Pattern

```
Then(/^(?:I |we )?take screenshots for all breakpoints$)
```

## Usage Examples

- `Then I take screenshots for all breakpoints`
- `Then we take screenshots for all breakpoints`
- `And I take screenshots for all breakpoints`
- `And we take screenshots for all breakpoints`
- `Then take screenshots for all breakpoints`
- `And take screenshots for all breakpoints`

## Configuration

Breakpoints are configured via:
- `DIFFY_BREAKPOINTS` environment variable, or
- `worldParameters.diffy.breakpoints` parameter
