
# When I fill in

## Overview

"These step definitions are used to simulate user input of data into different fields or form elements." The purpose is to verify website functionality related to data entry and form submission.

## Available Step Definitions

1. **When I fill in "field" with "value"**
2. **When I fill in "field" with "value" by its attribute**
3. **When I fill in "value" for "field"**
4. **When I fill in "value" for "field" by its attribute**
5. **When I fill in "field" with:**
6. **When I fill in "field" with an empty value by its attribute**
7. **When I fill in the following:**
8. **When I fill in the following: by its attribute**

Each variant supports different approaches to locating form elements—whether by label text, CSS selectors, or HTML attributes—and accommodates both single-field and multi-field input scenarios.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I fill in "Email" with "alice@example.com"
   And I press "Sign in"
```

### Example 2

```gherkin
When I fill in "username" with "alice" by attr
   And I fill in "password" with "s3cret" by attr
```

### Example 3

```gherkin
When I fill in the following:
     | First name | Alice |
     | Last name  | Smith |
```

### Example 4

```gherkin
When I fill in "alice" for "#user"
   And I press "Submit"
```

### Example 5

```gherkin
When I fill in "Hello" for "Your message" by its "placeholder" attribute
```

