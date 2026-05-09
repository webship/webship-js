
# Given I am an anonymous user

## Step Definition

```gherkin
Given(/^(I am |we are )?an anonymous user)
```

## Description

"This step ensures that the current user is not logged in." It configures the browser to simulate a guest visitor state without active session or authentication credentials.

## Usage Examples

```gherkin
Given I am an anonymous user
```

```gherkin
Given we are an anonymous user
```

```gherkin
Given an anonymous user
```

## Purpose

The step definition supports three syntactic variations to accommodate different BDD writing styles while accomplishing the same objective: establishing an unauthenticated user context for test execution.

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Given I am an anonymous user
   When I am on "/dashboard"
   Then I should see "Sign in"
```

### Example 2

```gherkin
Given I am an anonymous user
   When I am on the homepage
   Then I should not see "Logout"
```

### Example 3

```gherkin
Given I am an anonymous user
   When I am on "/checkout"
   Then I should be on "/login"
```

### Example 4

```gherkin
Given an anonymous user
   When I am on "/admin"
   Then the response status code should be 403
```

