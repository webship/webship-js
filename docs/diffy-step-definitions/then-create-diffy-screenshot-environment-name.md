
# Then create diffy screenshot from "environment name" environment

## Overview

This Webship JS step definition instructs Diffy to capture a snapshot remotely from a specified environment within your project. The step accepts both abbreviated and full environment names, including custom environments.

## Gherkin Step Pattern

```
Then (I |we )*create diffy screenshot from "([^"]*)" environment
```

## Description

"Ask Diffy to capture a snapshot remotely from a named environment on the project. Accepts short (prod/stage/dev) or long (production/staging/development) forms, plus 'custom'."

## Examples

```gherkin
Then create diffy screenshot from "production" environment
Then create diffy screenshot from "prod" environment
Then create diffy screenshot from "staging" environment
Then create diffy screenshot from "stage" environment
Then create diffy screenshot from "development" environment
Then create diffy screenshot from "dev" environment
Then create diffy screenshot from "custom" environment
```

## Supported Environment Names

- **Production**: "production" or "prod"
- **Staging**: "staging" or "stage"
- **Development**: "development" or "dev"
- **Custom**: "custom" (for user-defined environments)
