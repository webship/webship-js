
# When I check "checkbox"

## Step Definition

This step definition serves as a command to mark/select a checkbox.

**Gherkin Pattern:**
```
When (I|we)* check "([^"]*)?"
```

## Description

Define the step of checking the checkbox element specified by id|class|name|label.

## Examples

**Example (1): label**
```
When I check "Remember me"
```

**Example (2): id/class**
```
When I check "rememberme"
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I check "Remember me"
   And I press "Sign in"
```

### Example 2

```gherkin
When I check "#newsletter"
   Then the "#newsletter" checkbox should be checked
```

### Example 3

```gherkin
When we check ".terms"
   And I press "Continue"
```

### Example 4

```gherkin
When I check "Subscribe to updates"
   Then the checkbox "#subscribe" is checked
```

