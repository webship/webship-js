
# When I wait for AJAX to finish

## Step Definition

```gherkin
'When (I |we )*wait for AJAX to finish'
```

## Description

"This step waits for an active XMLHttpRequest and Fetch API requests to complete."

## Examples

```gherkin
When I wait for AJAX to finish
```

```gherkin
And I wait for AJAX to finish
```

```gherkin
When we wait for AJAX to finish
```

```gherkin
And wait for AJAX to finish
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I press "Search"
   And I wait for AJAX to finish
   Then I should see "Results"
```

### Example 2

```gherkin
When I follow "Inbox"
   And I wait for AJAX to finish
   Then I should see at least 1 ".message" element
```

### Example 3

```gherkin
And I wait for AJAX to finish
```

### Example 4

```gherkin
When we wait for AJAX to finish
   Then "<.toast-success>" should be visible
```

