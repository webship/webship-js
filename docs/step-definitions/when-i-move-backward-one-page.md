
# When I move backward one page

## Gherkin Step

```gherkin
When (I|we)* move backward one page
```

## Description

This step definition represents user interaction for navigating backward through a series of pages on a website. It's commonly employed when browsing paginated lists—allowing testers to visit each page, execute necessary tests, and return to the main list page before advancing to the subsequent page.

## Technical Details

- **Sentence Definition Type**: Static (no probabilities)
- **Common Use Case**: Paginated list navigation and testing workflows

## Related Step Definitions

The documentation includes related navigation steps such as "When I move forward one page" and "When I reload the page," available within the Webship JS 2.0.x step definitions library.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I follow "About"
   And I move backward one page
   Then I should be on the homepage
```

### Example 2

```gherkin
When I go to "/cart"
   And I move backward one page
   Then I should be on "/products"
```

### Example 3

```gherkin
When we move backward one page
   And I wait for AJAX to finish
```

