
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

## Reading the page text

`I should see "text"`, `I should not see "text"` and `eventually I should see "text"` read the page the same way: the text of the page as Playwright's text matching reads it.

- Letter case is ignored: on a page that reads "Next page", `I should see "next page"` passes and `I should not see "next page"` fails.
- Runs of white space are collapsed, so a line the markup wraps still matches.
- The text of hidden elements counts; the text of `<script>`, `<noscript>` and `<style>` does not.
- The value of a field, the text of an image and the content of an iframe are not page text.

`I should see` waits up to 5 seconds for the text to come, `I should not see` up to 5 seconds for it to go, and `eventually I should see` up to 10 seconds, or the "within N seconds" it is given.

For the text a visitor can see, with its letter case, use `I wait for the text "text" to appear` or `I wait for the text "text" to disappear`; for an element, `"<selector>" should be visible` or `"<selector>" should not be visible`.

## Seeing an element

`I should see (a/an) "text" element` and `I should not see (a/an) "text" element` name the element by its exact visible text, as it reads on the page. A `<label for="...">` stands for the control it labels. "Should not see" is the opposite of "should see": it passes when no element named that way is visible, so an element that is hidden does not fail it.

The text is not a CSS selector. For a selector use `"<selector>" should be visible` or `"<selector>" should not be visible`.

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

