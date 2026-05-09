
# Then compare diffy "ENV1" with "ENV2"

## Description

This step initiates a Diffy comparison between two project environments. When either environment is specified as "custom", the step uses the `DIFFY_ENV1_URL` and `DIFFY_ENV2_URL` environment variables.

## Gherkin Step Pattern

```
Then (I |we )*compare diffy "([^"]*)" with "([^"]*)"
```

## Examples

```
Then compare diffy "prod" with "stage"
Then compare diffy "production" with "staging"
Then compare diffy "prod" with "dev"
Then compare diffy "stage" with "dev"
Then compare diffy "prod" with "baseline"
Then compare diffy "baseline" with "custom"
Then compare diffy "custom" with "custom"
Then compare diffy "production" with "development"
```

## Parameters

- **First Environment**: The initial environment name for comparison
- **Second Environment**: The environment to compare against (uses custom URLs when "custom" is specified)
