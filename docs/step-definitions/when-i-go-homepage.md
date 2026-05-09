
# When I go to the homepage

## Step Definition

The Gherkin step pattern for this navigation action is:

```
When (I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)
```

## Description

This step definition enables users to navigate to the website's homepage during testing. The implementation varies based on the testing framework, potentially involving clicking navigation elements, entering URLs directly, or executing predefined navigation commands in web applications.

## Usage Examples

```
When I go to homepage

When I go to the homepage

When I navigate to the homepage

When navigating to the homepage

When navigating to homepage

When navigating to the frontpage

When we go to the homepage

When we navigate to the homepage
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I go to the homepage
   Then "<#hero>" should be visible
```

### Example 2

```gherkin
When we navigate to homepage
   Then I should see "Welcome"
```

### Example 3

```gherkin
When navigating to the frontpage
   Then I should be on "/"
```

