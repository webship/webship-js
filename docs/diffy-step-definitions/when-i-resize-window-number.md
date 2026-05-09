
# When I resize window to "number"

## Step Definition

```
When(/^(?:I |we )?resize window to "([^"]*)")
```

## Description

"Resize browser viewport to a breakpoint width (plus Diffy window padding)."

## Examples

```
When I resize window to "1200"
When we resize window to "640"
When I resize window to "320"
When we resize window to "768"
When I resize window to "1024"
When we resize window to "1440"
When I resize window to "1920"
When we resize window to "375"
```

## Parameters

- `number`: The viewport width in pixels to resize the browser window to
