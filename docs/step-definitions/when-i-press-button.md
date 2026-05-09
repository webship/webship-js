
# When I press "button"

## Step Definition

**Gherkin Syntax:**
```
When (I|we)* press "([^"]*)?"
```

## Description

This step definition executes a command to press a button by its text, ensuring the correct execution of the expected action.

## Example

**By text:**
```
When I press "Log In"
```

## Related Documentation

This step is part of the Webship JS 2.0.x Step Definitions documentation and has a sub-variant:
- When I press "button" by attribute

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I press "Sign in"
   And I wait until the URL contains "/dashboard"
```

### Example 2

```gherkin
When I press the "Submit" button
   And I wait for AJAX to finish
```

### Example 3

```gherkin
When we press "Cancel"
   Then I should not see the modal
```

### Example 4

```gherkin
When I press "save-btn" by attr
   Then I should see "Saved"
```

