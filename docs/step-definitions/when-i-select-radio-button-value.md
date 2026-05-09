
# When I select radio button "value"

## Step Definition

```
When (I |we ) select radio button "([^"]*)?"`
```

## Description

Selects the radio button specified by label text, value, or selector.

## Examples

```
When I select radio button "Male"
When I select radio button "female"
When I select radio button "#gender-male"
When we select radio button "option1"
```

## Usage Notes

The step accepts multiple input types: label text, value attributes, or CSS selectors to identify and select the target radio button element.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I select radio button "Male"
```

### Example 2

```gherkin
When I select radio button "#gender-female"
```

### Example 3

```gherkin
And we select radio button "Premium"
```

### Example 4

```gherkin
When I select radio button "monthly"
   Then the radio button with value "monthly" should be selected
```

### Example 5

```gherkin
When I select radio button "Yes"
   And I press "Continue"
```

