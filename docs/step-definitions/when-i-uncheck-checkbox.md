
# When I uncheck "checkbox"

## Overview
This step definition serves as a command to clear/deselect a checkbox element.

## Gherkin Syntax
```
When (I|we)* uncheck "([^"]*)?"
```

## Description
Define the step of unchecking the checkbox element specified by id|class|name|label.

A toggle switch whose slider covers its checkbox, and a checkbox that its label draws (the box itself hidden), are unchecked by clicking their label, as a person does; the step then waits up to 5 seconds for the box to be unchecked (since 2.0.13). A checkbox that cannot be found, is hidden with no label to click, or is disabled fails the step with hints about what to verify.

## Examples

**Example (1): label**
```
When we uncheck "Remember me"
```

**Example (2): id/class**
```
When I uncheck "rememberme"
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I uncheck "Remember me"
   And I press "Sign in"
```

### Example 2

```gherkin
When I uncheck "#newsletter"
   Then the "#newsletter" checkbox should not be checked
```

### Example 3

```gherkin
When we uncheck ".terms"
```

### Example 4

```gherkin
When I uncheck "Subscribe to updates"
   Then the checkbox "#subscribe" is not checked
```

