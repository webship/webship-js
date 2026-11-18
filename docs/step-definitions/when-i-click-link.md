
# When I click "link"

## Step Definition

```gherkin
When (I|we)* click "([^"]*)?"
```

## Description

This step clicks a link or a button by its visible text: the first `a`, `button`, `[role="button"]`, `input[type="button"]` or `input[type="submit"]` whose whole text is the given text.

The match is case-sensitive and covers the whole text, so `When I click "Read more"` does not click "Read more about us". White space around the text and inside it, the way a template prints it, does not count (since 2.0.13): `When I click "Read more"` clicks a link whose markup reads `<a> Read   more </a>`.

To follow a link a person can see, use `When I follow "text"`: it takes the first visible link of that name, passing over a hidden copy in a closed menu, waits up to 5 seconds for one, and says so when every match is hidden (since 2.0.13).

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

