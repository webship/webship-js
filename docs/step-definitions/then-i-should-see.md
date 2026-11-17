
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

## Seeing an element

`I should see (a/an) "text" element` and `I should not see (a/an) "text" element` name the element by its exact visible text, as it reads on the page. A `<label for="...">` stands for the control it labels. "Should not see" is the opposite of "should see": it passes when no element named that way is visible, so an element that is hidden does not fail it.

The text is not a CSS selector. For a selector use `"<selector>" should be visible` or `"<selector>" should not be visible`. When the argument looks like a selector (`.news-item`, `#main`, `[data-testid=card]`, `div.card`, or a bare tag name such as `header`), a failure of `I should see a "…" element` says so and names the selector step, and `I should not see a "…" element` prints a warning when it passes while that selector matches a visible element: it checked a text, not the selector.

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

