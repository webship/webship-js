
# Then create diffy comparison

## Description
This step generates a Diffy comparison (visual diff) by utilizing the two most recently uploaded snapshots.

## Gherkin Syntax
```gherkin
Then (I |we )*create diffy comparison
```

## Usage Examples
The step accepts several grammatical variations:

```gherkin
Then create diffy comparison
And create diffy comparison
Then I create diffy comparison
Then we create diffy comparison
And I create diffy comparison
And we create diffy comparison
```

## Purpose
Creates a visual comparison report from the last pair of snapshots that were uploaded to Diffy, allowing teams to identify visual regressions between environments or versions.
