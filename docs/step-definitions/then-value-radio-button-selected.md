
# Then the "value" radio button is selected

## Step Definition

```
Then (the )"([^"])?" radio button is( not)* selected
```

## Description

This step verifies whether a specified radio button is selected or not using Nightwatch's built-in assertion functionality.

## Examples

**Example #1:** `Then the "#gender-male" radio button is selected`

Confirms that the radio button with the specified selector is currently selected.

**Example #2:** `Then the "#gender-female" radio button is not selected`

Validates that the radio button is not in a selected state.

## Parameters

- **Selector** (required): The radio button identifier, typically a CSS selector or element reference in quotes
- **Negation** (optional): The phrase "not" can be appended to assert the button is unselected

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then the "#gender-male" radio button is selected
```

### Example 2

```gherkin
Then the "#plan-premium" radio button is selected
```

### Example 3

```gherkin
And the ".option-1" radio button is not selected
```

### Example 4

```gherkin
Then the "#yes" radio button is selected
```

### Example 5

```gherkin
Then the "#monthly" radio button is not selected
```

