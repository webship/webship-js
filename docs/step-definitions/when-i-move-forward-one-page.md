
# When I move forward one page

## Gherkin Step Definition

```gherkin
When (I|we)* move forward one page
```

## Description

This step definition represents a user action for navigating forward through a sequence of pages on a website. It's typically employed after the user has moved backward one or more pages and then decides to advance forward again.

## Usage Context

The step is commonly used in scenarios where:
- A user has previously navigated backward through multiple pages
- The user then chooses to move forward one page
- This action may be repeated for additional forward navigation steps

## Technical Details

- **Static sentence definition**: Yes
- **Probabilities**: None (static definition)

## Purpose

This step allows test authors to validate browser navigation behavior, simulating user interactions with browser forward button functionality or equivalent page navigation controls.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I move backward one page
   And I move forward one page
   Then I should be on "/about"
```

### Example 2

```gherkin
When I go to "/x"
   And I go to "/y"
   And I move backward one page
   And I move forward one page
   Then I should be on "/y"
```

### Example 3

```gherkin
When we move forward one page
   And I wait until the page is interactive
```

