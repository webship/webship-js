
# When I save screenshot with name "filename"

## Description
Save a screenshot using an explicit filename (tokens supported).

## Gherkin Step Syntax
```
When (I |we )*save screenshot with name "([^"]*)"
```

## Examples

**Example #1:**
```
When I save screenshot with name "homepage.png"
```

**Example #2:**
```
When we save screenshot with name "webship-home"
```

**Example #3:**
```
When save screenshot with name "un-landing-{datetime}.png"
```

**Example #4:**
```
Given I am on "/news"
When I save screenshot with name "news-latest.png"
```

**Example #5:**
```
Given I am on "/un.org"
When I save screenshot with name "un-home.png"
```

## Key Features
- Supports explicit filename specification
- Allows optional "I" or "we" pronouns
- Supports token substitution (e.g., `{datetime}`)
- Flexible filename formats (with or without extensions)
