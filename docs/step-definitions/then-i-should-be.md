
# Then I should be

## Overview

This step definition category is designed to verify that navigation functions correctly and users arrive at the intended pages following interactions. As stated on the page: "This step is useful for ensuring that the navigation through a website is working correctly and that the user lands on the intended page after performing certain actions or interactions."

## Available Step Definitions

The "Then I should be" group contains four primary variations:

1. **Then I should be on (the) homepage**
2. **Then I should not be on (the) homepage**
3. **Then I should be on "specific page"**
4. **Then I should not be on "page path"**

Each step allows testers to validate whether the current page matches expected navigation outcomes.

## Purpose

These assertions verify successful navigation by confirming the user's location within the website after executing actions like clicking links, submitting forms, or using browser controls. They serve as validation checkpoints in automated testing workflows.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then I should be on "/dashboard"
```

### Example 2

```gherkin
Then I should be on the homepage
```

### Example 3

```gherkin
And I should not be on the frontpage
```

### Example 4

```gherkin
Then we should be on "/account"
```

### Example 5

```gherkin
Then I should be on "/auth/callback"
```

