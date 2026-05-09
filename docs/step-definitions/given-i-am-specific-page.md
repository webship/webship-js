
# Given I am on "specific" page

## Step Definition Pattern

```gherkin
Given (I am |we are )*on( the)* "([^"]*)?"( page)*
```

## Description

This step definition establishes the initial context for test scenarios by navigating to a designated webpage. Upon execution, it performs the necessary actions to access a specific page, including launching a browser, entering the URL, and allowing the page to fully load.

## Usage Examples

```gherkin
Given I am on "contact"

Given we are on "user/login"

Given I am on the "/about-us" page

Given we are on the "/about-us" page

Given on "/about-us"

Given on the "/about-us" page
```

## Key Information

This step definition is part of the Webship JS 2.0.x documentation's Step Definitions section. It supports flexible phrasing patterns, allowing users to specify page locations using various grammatical structures. The pattern accepts optional articles ("the") and the word "page," accommodating different natural language preferences while directing the test to navigate to the specified URL or page identifier.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Given I am on "/about"
   Then I should see "Our mission"
```

### Example 2

```gherkin
Given I am on "/products?category=laptops"
   Then I should see 12 ".product-card" elements
```

### Example 3

```gherkin
Given we are on the "/contact" page
   Then "<form>" should be visible
```

### Example 4

```gherkin
Given I am on "/blog/2026/05/launch"
   Then the page should have exactly one h1
```

### Example 5

```gherkin
Given on "/admin/users"
   Then I should see "User list"
```

