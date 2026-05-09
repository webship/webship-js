
# Given I am on homepage

## Step Definition

```
Given (I am |we are )?on( the)* (homepage|frontpage)
```

## Description

This step definition establishes the initial context for test scenarios by specifying that a user is currently viewing the website's homepage. When executed, it performs necessary actions to navigate to the homepage, which may include opening a browser, entering the URL, and waiting for the page to fully load. Implementation details vary based on the testing framework and application being tested.

## Examples

```
Given I am on homepage

Given I am on the homepage

Given I am on frontpage

Given I am on the frontpage

Given we are on homepage

Given on the homepage

Given on homepage

Given we are on the frontpage

Given on frontpage
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Given I am on the homepage
   Then I should see "Welcome"
```

### Example 2

```gherkin
Given we are on homepage
   Then "<header>" should be visible
```

### Example 3

```gherkin
Given on the frontpage
   Then the page should have a main landmark
```

### Example 4

```gherkin
Given I am on the homepage
   When I follow "About"
   Then I should be on "/about"
```

