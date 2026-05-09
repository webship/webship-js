
# When I Scroll

## Overview

"Use this step when you want to simulate a scroll action on the page during your automated testing scenario. It can be helpful to test lazy-loaded elements, infinite scroll areas, or to simply bring specific elements into view."

## Available Scroll Step Definitions

The following scroll-related steps are available in Webship JS 2.0.x:

- When I scroll down
- When I scroll up
- When I scroll to top
- When I scroll to the bottom
- When I scroll to top of "<selector>"
- When I scroll to bottom of "<selector>"
- When I scroll right
- When I scroll left
- When I scroll to start
- When I scroll to the end
- When I scroll to start of "<selector>"
- When I scroll to end of "<selector>"

Each step enables testing of different scrolling behaviors to validate page functionality, element visibility, and lazy-loading mechanisms within automated testing scenarios.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I scroll down
```

### Example 2

```gherkin
When I scroll down 800
```

### Example 3

```gherkin
And I scroll to the top
```

### Example 4

```gherkin
When I scroll to the bottom
   And I wait for AJAX to finish
```

### Example 5

```gherkin
When I scroll to top of "#sidebar"
```

### Example 6

```gherkin
And we scroll to bottom of "#log-panel"
```

### Example 7

```gherkin
When I scroll right 500
```

