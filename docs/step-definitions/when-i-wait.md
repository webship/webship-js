
# When I Wait

## Description

"This step definition indicates that the user will pause or wait for the specified number of seconds/minutes or the maximum number of seconds/minutes before moving to the next step." The functionality is designed for scenarios requiring time-based delays or expected pauses during test execution.

## Available Step Definitions

The "When I wait" category encompasses five distinct variations:

1. **When I wait until the page loaded** - Pauses execution until page load completion

2. **When I wait {number} seconds** - Implements a fixed pause for the specified seconds duration

3. **When I wait max {number} seconds** - Establishes a maximum wait period in seconds with early completion upon condition satisfaction

4. **When I wait {number} minutes** - Creates a fixed pause measured in minutes

5. **When I wait max {number} minutes** - Sets a maximum wait period in minutes, allowing early termination when conditions are met

## Use Cases

These steps prove particularly useful in automated testing scenarios where applications require time-dependent behavior verification or asynchronous operations demand explicit wait periods before proceeding with subsequent test steps.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I press "Save"
   And I wait 2 seconds
   Then I should see "Saved"
```

### Example 2

```gherkin
When I follow "Pricing"
   And I wait until the page is loaded
```

### Example 3

```gherkin
And I wait 1 second
```

### Example 4

```gherkin
When I wait max of 5 seconds
```

### Example 5

```gherkin
And I wait until pending timers settle
```

