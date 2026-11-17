
# When I select "option" from "select list"

## Step Definition

```
When (I|we)* select "([^"]*)?" from "([^"]*)?"
```

## Description

"This step definition acts as a command to select an option from a dropdown list." The mechanism identifies a select element by its associated label, then selects the matching option based on its displayed text.

The select list is named by the exact text of its label (one word or several), else by its name, else by its id; a name that starts with `#`, `.` or `[` is a CSS selector. The option is named by its text, else by its value. When no select list is found within 5 seconds, or the list has no such option, the step fails at once and lists the options the list has.

## Example

**Selection by label:**

```
When we select "Mercedes" from "Cars"
```

This syntax allows test authors to select dropdown values using human-readable option names and field labels rather than technical selectors.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I select "Mercedes" from "Cars"
   Then I should see "Mercedes selected"
```

### Example 2

```gherkin
When I select "saab" from "#cars"
```

### Example 3

```gherkin
When we select "English" from "Language"
```

### Example 4

```gherkin
When I select "Premium" from "Plan"
   And I press "Continue"
```

