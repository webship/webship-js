
# Then wait for diffy comparison to complete

## Description

This step polls the most recently created Diffy comparison until it reaches a terminal state. The default timeout is set to `DIFFY_MAX_WAIT` seconds, which defaults to 1200 seconds.

## Gherkin Syntax

```
Then (I |we )*wait for diffy comparison to complete
```

## Examples

- `Then wait for diffy comparison to complete`
- `And wait for diffy comparison to complete`
- `Then I wait for diffy comparison to complete`
- `Then we wait for diffy comparison to complete`
- `And I wait for diffy comparison to complete`
- `And we wait for diffy comparison to complete`
