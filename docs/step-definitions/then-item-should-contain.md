
# Then the item should contain

## Overview

This documentation page describes a collection of step definitions that function as assertions or expectations. They verify whether specific elements contain particular content, text, or CSS styles.

## Step Definitions

### Field Content Assertions

**Then the "item" field should contain "value"**
- Verifies a field element contains specified text

**Then the "item" field should not contain "value"**
- Confirms a field element does not contain specified text

### Response Content Assertions

**Then the response should contain "text in the page"**
- Checks page response includes given text

**Then the response should not contain "text in the page"**
- Confirms page response excludes given text

### Element Style Assertions

**Then the "item" element should contain "CSS style"**
- Validates an element possesses specified CSS styling

**Then the "item" element should not contain "CSS style"**
- Ensures an element lacks specified CSS styling

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then the "#username" element should contain "color: rgb(0, 0, 0)"
```

### Example 2

```gherkin
Then the "body" element should contain "font-family: Arial"
```

### Example 3

```gherkin
And the "#cta" element should contain "background-color: rgb(255, 0, 0)"
```

### Example 4

```gherkin
Then the ".error" element should not contain "display: none"
```

### Example 5

```gherkin
Then the "#header" element should contain "padding: 16px"
```

