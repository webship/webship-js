
# Then I save "width" x "height" screenshot

## Description
Resize the viewport to specified dimensions and capture a screenshot.

## Gherkin Syntax
```
Then (I |we )*save (\d+) x (\d+) screenshot
```

## Examples

**Example #1:**
```
Then I save 1440 x 900 screenshot
```

**Example #2:**
```
Then we save 1200 x 800 screenshot
```

**Example #3:**
```
Given I am on "/about-us"
Then I save 1440 x 900 screenshot
```

## Parameters
- First numeric parameter: viewport width (in pixels)
- Second numeric parameter: viewport height (in pixels)

The step adjusts the browser window to the specified dimensions before capturing the screenshot.
