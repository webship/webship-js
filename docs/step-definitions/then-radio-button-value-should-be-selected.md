
# Then the radio button "value" should be selected

## Gherkin Step Definition

```
Then( the)* radio button with value "([^"]*)?" should( not)* be selected
```

## Description

This step validates whether a radio button matching the specified selector is selected or not selected on the page.

## Examples

**Example #1:**
```
Then the radio button "#gender-male" should be selected
```

**Example #2:**
```
Then the radio button ".option-1" should be selected
```

**Example #3 (Negative assertion):**
```
Then the radio button "#gender-female" should not be selected
```

## Purpose

The step definition "verifies that the radio button is not selected" or confirms its selected state based on the assertion type used (with or without the `not` modifier).

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then the radio button with value "male" should be selected
```

### Example 2

```gherkin
Then the radio button with value "premium" should be selected
```

### Example 3

```gherkin
And the radio button with value "monthly" should not be selected
```

### Example 4

```gherkin
Then the radio button with value "yes" should be selected
```

### Example 5

```gherkin
Then the radio button with value "annual" should not be selected
```

