
# When I go to "specific page"

## Step Definition

The Gherkin step syntax is:

```
When (I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"
```

## Description

This step definition enables users to navigate to a particular page within the website under test. The actual implementation varies based on the testing framework employed. For web applications, this typically involves selecting a hyperlink or button, entering a URL directly, or leveraging a built-in navigation function.

## Examples

```
When I go to "contact"

When I go to "/user/login"

When I navigate to "/admin/dashboard"

When navigating to "/products"

When we go to "/products"

When we navigate to "/terms"
```

## Key Details

This step accepts flexible phrasing with multiple variations including "go," "navigate," and collective pronouns ("we"). The page identifier is captured as a parameter in quotation marks and can represent either a page name or a complete URL path.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I go to "/about"
   Then I should see "Our mission"
```

### Example 2

```gherkin
When I navigate to "/admin/dashboard"
   And I wait until the URL contains "/dashboard"
```

### Example 3

```gherkin
When we go to "/cart"
   Then "<#cart-list>" should be visible
```

### Example 4

```gherkin
When navigating to "/products"
   Then I should see at least 5 ".product-card" elements
```

