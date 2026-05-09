
# When I click "link"

## Step Definition

```gherkin
When (I|we)* click "([^"]*)?"
```

## Description

This step definition functions as a command to click a link, ensuring correct navigation to the expected page. It allows you to define the step for clicking the link by its text.

## Example

```gherkin
When I click "Contact Us"
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I click "About"
   Then I should be on "/about"
```

### Example 2

```gherkin
When I click "Read more"
   And I wait for AJAX to finish
```

### Example 3

```gherkin
When we click "Contact"
   Then "<form#contact>" should be visible
```

### Example 4

```gherkin
When I click "main-nav-link" by attr
   Then I should see "Pricing"
```

