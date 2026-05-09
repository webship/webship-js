
# When I click "operation" in "text" row

## Step Definition

```
When (I |we )*click "([^"]*)?" in( the)* "([^"]*)?" row$
```

## Description

This step locates a table, finds a row containing specified identifier text, and clicks on the target text within that row.

## Functionality

The step performs a targeted click on specific text within a table row that contains a given identifier.

## Examples

```
When I click "Edit" in the "John Smith" row
```

```
When I click "Delete" in the "Product A" row
```

```
When we click "View Details" in the "Order #12345" row
```

```
And I click "Download" in the "Report 2024" row
```

## Parameters

- **First parameter** ("operation"): The clickable text/action within the row
- **Second parameter** ("text"): The identifier text that locates the specific row

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
When I click "Edit" in the "Alice Smith" row
   Then I should see "Edit user"
```

### Example 2

```gherkin
When I click "Delete" in the "Project Alpha" row
   And I wait for the modal to appear
```

### Example 3

```gherkin
When we click "Download" in the "Report 2026" row
```

### Example 4

```gherkin
When I click "Approve" in the "Order #1234" row
   And I wait for AJAX to finish
```

