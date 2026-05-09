
# Then the "item" link should contain "url"

## Basic Definition

This step ensures that the `href` attribute of a link element includes a URL or part of a URL, identified by its link text.

**Gherkin Pattern:**
```
Then (the )*"([^"]*)?" link should contain "([^"]*)?"
```

**Example:**
```
Then the "Login" link should contain "/log-in"
```

## By Attribute Variant

This variation checks a link's href using an attribute selector approach.

**Gherkin Pattern:**
```
Then (the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*( "([^"]*)?")* (attribute|attr)
```

**Example 1:**
```
Then the "#aboutUsid" link should contain "about" by attr
```

**Example 2:**
```
Then the ".contactUs" link should contain "/contact-" by attr
```

## By Specific Attribute Variant

Checks link content against a particular attribute type.

**Gherkin Pattern:**
```
Then the "item" link should contain "url" by its "class" attribute
```

**Example:**
```
Then the "aboutUs" link should contain "about" by its "class" attribute
```

## More examples

<!-- generated: extended-examples -->

### Example 1

```gherkin
Then the "Login" link should contain "/log-in"
```

### Example 2

```gherkin
And the "About Us" link should contain "/about"
```

### Example 3

```gherkin
Then "Home" link should contain "/"
```

### Example 4

```gherkin
Then the "main-nav" link should contain "about" by its "class" attribute
```

### Example 5

```gherkin
Then the "#contact" link should contain "/contact-us" by attr
```

