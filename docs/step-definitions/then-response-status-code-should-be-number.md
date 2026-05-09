
# Then the response status code should be {number}

## Description

"This step definition is used after making a request to the web service under test. Once the response is received, this step definition asserts HTTP status code returned by the server matches the expected code."

## Gherkin Syntax

```
Then the response status code should( not)* be (\d+)
```

## Examples

### Example 1: Successful Request
```
Then the response status code should be 200
```

The code 200 indicates a successful request where "the server has processed the request and returned the appropriate response."

### Example 2: Resource Not Found
```
Then the response status code should not be 404
```

The code 404 indicates "the requested resource not found on the server. Meaning a possible error or invalid URL. So that it should not be 404."

## Parameters

- `{number}`: The expected HTTP status code (numeric value)
- `not` (optional): Negation modifier to assert the status code should NOT match the specified value

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then the response status code should be 200
```

### Example 2

```gherkin
Then the response status code should be 404
```

### Example 3

```gherkin
And the response status code should be 301
```

### Example 4

```gherkin
Then the response status code should not be 500
```

### Example 5

```gherkin
When I am on "/admin"
   Then the response status code should be 403
```

