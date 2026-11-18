
# When I check "checkbox"

## Step Definition

This step definition serves as a command to mark/select a checkbox.

**Gherkin Pattern:**
```
When (I|we)* check "([^"]*)?"
```

## Description

Define the step of checking the checkbox element specified by id|class|name|label.

A toggle switch whose slider covers its checkbox, and a checkbox that its label draws (the box itself hidden), are checked by clicking their label, as a person does; the step then waits up to 5 seconds for the box to be checked (since 2.0.13). A checkbox that cannot be found, is hidden with no label to click, or is disabled fails the step with hints about what to verify.

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

