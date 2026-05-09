
# When I reload the page

## Step Definition

```gherkin
When (I|we)* reload( the)* page
```

## Description

This step definition is employed in website testing to signal that the user is refreshing the current page. It's typically used after executing an event on the page, when results are expected to appear following a page reload.

## Usage Examples

```gherkin
When I reload the page
When we reload page
```

## Context

The step definition supports flexible phrasing with optional words, allowing testers to write natural language scenarios. It's part of the Webship JS 2.0.x testing framework and appears within the broader "Step Definitions" documentation section alongside other navigation and interaction steps.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I reload
   Then I should see "Welcome"
```

### Example 2

```gherkin
When I press "Save"
   And I reload the page
   Then I should see "Saved"
```

### Example 3

```gherkin
When we reload page
   And I wait for AJAX to finish
   Then "<.spinner>" should not be visible
```

