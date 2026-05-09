
# Then I should see

## Overview

This step definition enables verification that specific elements or messages display correctly on a webpage or application, confirming expected content visibility for both users and automated tests.

## Available Step Definitions

The following step variations are available:

- Then I should see "text in the page"
- Then I should not see "text in the page"
- Then I should see text matching "text pattern"
- Then I should not see text matching "text pattern"
- Then I should see text matching "text pattern" in the "element" element
- Then I should not see text matching "text pattern" in the "element" element
- Then I should see (a/an) "field" element
- Then I should not see (a/an) "field" element
- Then I should see "value" in the "text" element
- Then I should not see "value" in the "text" element
- Then I should see "value" in the "text" element by attr
- Then I should not see "value" in the "text" element by attr

## Purpose

"This step is useful for verifying that certain elements or messages are displayed correctly on a webpage or application, ensuring that the expected content is visible to the user or the automated tests."

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then I should see "Welcome"
```

### Example 2

```gherkin
Then I should not see "Access denied"
```

### Example 3

```gherkin
And I should see "Order Confirmed"
```

### Example 4

```gherkin
Then we should see "Sign in"
```

### Example 5

```gherkin
Then I should see "Total: $99.00"
```

