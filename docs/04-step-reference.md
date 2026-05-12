# Step Definition Reference

All step definitions ship in `tests/step-definitions/*.steps.js`. Cucumber-js loads every file in that directory automatically — you never `require()` a step file from your features.

This is a topical reference. For per-step examples, see the JSDoc comment above each definition in the source files.

## Navigation

| Step | Source |
| --- | --- |
| `Given I am on the homepage` | `webship.js` |
| `Given I am on "/path"` | `webship.js` |
| `When I go to the homepage` | `webship.js` |
| `When I go to "/path"` | `webship.js` |
| `When I move backward one page` | `webship.js` |
| `When I move forward one page` | `webship.js` |
| `When I reload the page` | `webship.js` |

## Click & press

| Step | Notes |
| --- | --- |
| `When I click "Text"` | Finds link/button by visible text |
| `When I click "value" by attr` | Finds by id/class/name/aria/data-test |
| `When I click "Text" in the "Row" row` | Click inside a table row |
| `When I press "Submit" button` | Native form submit / role=button |

## Form fields

| Step | Notes |
| --- | --- |
| `When I fill in "Label" with "value"` | Resolves by label / placeholder / name |
| `When I fill in "value" for "Label"` | Reverse phrasing |
| `When I fill in "value" for "selector" by attr` | By attribute |
| `When I fill in the following:` (table) | Bulk fill |
| `When I select "Option" from "Label"` | `<select>` |
| `When I additionally select "Option" from "Label"` | Multi-select |
| `When I check the checkbox "#agree"` | |
| `When I uncheck the checkbox "#agree"` | |
| `When I choose the radio button "#radio"` | |

## Waits — see [BBR](02-bbr-smart-waits.md)

All wait phrasings live in `wait.steps.js`. Quick list:

```
I wait N seconds                                  # Bounded smart wait
I wait max of N seconds                           # Same; explicit "max"
I wait for N seconds                              # Cucumber {int}
I wait for N seconds for AJAX to finish           # Same
I wait until the page is loaded                   # Edge
I wait for AJAX to finish                         # Edge
I wait until the network is idle                  # Edge alias
I wait until the page is interactive              # body+DOMContentLoaded
I wait until pending timers settle                # setTimeout drain
I wait for "selector" to appear                   # Selector edge
I wait for "selector" to disappear                # Selector edge
I wait for the text "..." to appear/disappear     # Text edge
I wait until the URL contains "..."               # URL edge
I wait until the page title is/contains "..."     # Title edge
I wait until N elements match "selector"          # Count edge
I wait until at least N elements match "selector" # Count edge
I wait for the modal to appear/disappear          # Modal edge
eventually I should see "..."                     # Polling text assertion
```

## Modal

| Step | |
| --- | --- |
| `Then I should see the modal` | |
| `Then I should not see the modal` | |
| `Then I should see "text" in the modal` | |
| `Then the modal should contain "text"` | |
| `When I click "OK" in the modal` | |
| `When I click on "#sel" in the modal` | |
| `When I close the modal` | |

## Web-first assertions (auto-retry)

```
"selector" should be visible|hidden|attached|focused|enabled|disabled|editable [within N seconds]
"selector" should be in the viewport [within N seconds]
"selector" should have a count of N
"selector" should have text "..."
"selector" should contain text "..."
"selector" should have value "..."
"selector" should have attribute "name" with value "..."
"selector" should have class "..."
I click the "Text" button|link|tab|menuitem|checkbox|radio|option
the "Text" button should be visible
```

## Cookies / response / metatag

See `cookie.steps.js`, `response.steps.js`, `metatag.steps.js`.

## Tables

```
the table "selector" should have N rows
the table "selector" should have N columns
the table "selector" should not be empty
I should see "Text" in the "RowMatch" row
```

## Iframes / file download / REST / XML / keyboard

See per-topic files in `tests/step-definitions/`. Each file has JSDoc above every step with all pronoun and tense variants.

## Network mocking — see [Networking](06-network-and-dialogs.md)

```
Given the URL "**/api/**" returns the JSON: """ ... """
Given the URL "**/api/login" returns status 401 with body "..."
Given the URL "**/analytics.js" is blocked
Given the URL "**/api/**" is delayed by 1500 ms
Given the network is offline
Given the network is online
Given I start recording network requests
Then a GET request to "**/api/users" should have been made
Then no request to "**/tracking" should have been made
```

## Browser dialogs

Single-shot (auto-detach after the next dialog):

```
Given I will accept the next dialog
Given I will dismiss the next dialog
Given I will accept the next dialog with "input"
```

Persistent (handler stays for the rest of the scenario):

```
Given I accept all confirmation dialogs
Given I do not accept any confirmation dialogs
```

Inspect the most recent dialog:

```
Then the last dialog message should be "..."
Then the last dialog message should contain "..."
Then the last dialog type should be "alert"|"confirm"|"prompt"|"beforeunload"
```

## Clock — see [Clock](08-clock-mocking.md)

```
Given the system time is "2026-05-08T10:00:00Z"
When I advance the clock by N ms|seconds|minutes
When I pause the clock
When I resume the clock
When I set the system time to "..."
```

## Auth — see [Auth state](07-auth-state.md)

```
When I save the auth state to "tests/auth/admin.json"
Given I restore the auth state from "tests/auth/admin.json"
Given I clear the auth state
```

## API — see [API testing](09-api-testing.md)

```
Given I set the header "X-Token" to "abc123"
Given I set the request body to '{"name": "Alice"}'
When I send a POST request to "/api/users"
When I send a POST request to "/api/users" with body: """ ... """
When I send a POST request to "/api/users" with form data: """ ... """
Then the API response code should be 200
Then the API response should contain "Alice"
Then the JSON property "user.name" should be "Alice"
Then the response header "content-type" should contain "json"
```

## A11y — see [Accessibility](10-accessibility.md)

```
Then every image should have an alt attribute
Then every form field should have an accessible label
Then the page should have a main landmark
Then the page should have a navigation landmark
Then the page should have exactly one h1
Then the page should declare a language
Then the page language should be "en"
Then the focused element should match "selector"
Then the focused element should be labeled "..."
```

## JS errors

```
Then there should be no JavaScript errors
Then there should be no JavaScript warnings
Then JavaScript errors should not match "TypeError"
Then print JavaScript errors
```

Errors are always tracked (page errors + matched console levels). At scenario end the collector reports per the active **mode**:

| Mode | Behaviour |
| --- | --- |
| `warn` (default) | Logs a yellow warning to stderr — scenario still passes |
| `fail` | Fails the scenario with the error list |
| `off` | Silent |

Mode resolution (first match wins):

1. **Scenario tag** — `@js-fail`, `@js-warn`, `@js-off`, plus back-compat `@javascript` (= fail) and `@js-errors` (= off).
2. **Env var** — `WEBSHIP_JS_ERROR_MODE=warn|fail|off`.
3. **`worldParameters.javascript.mode`** in `cucumber.js`.
4. **Default** — `warn`.

Settings (`worldParameters.javascript`):

| Key | Env override | Default | Effect |
| --- | --- | --- | --- |
| `mode` | `WEBSHIP_JS_ERROR_MODE` | `warn` | `warn` / `fail` / `off` |
| `levels` | `WEBSHIP_JS_ERROR_LEVELS` | `['error']` | Console levels to capture (csv when via env: `error,warning`) |
| `ignore` | `WEBSHIP_JS_ERROR_IGNORE` | _none_ | Regex; matching messages dropped before report |
| `beforeScenario` | `WEBSHIP_JS_ERROR_BEFORE` | `false` | Snapshot pre-existing errors at scenario start |
| `afterScenario` | `WEBSHIP_JS_ERROR_AFTER` | `true` | Report at scenario end |

The explicit step `Then there should be no JavaScript errors` always asserts (independent of `mode`) and suppresses the auto-report so a single error is not announced twice.

## Date tokens

Use `[relative:OFFSET]` or `[relative:OFFSET#FORMAT]` anywhere in a step argument:

```gherkin
Given the system time is "[relative:now#YYYY-MM-DD]"
When I fill in "[relative:+1 day#YYYY-MM-DD]" for "Birth date"
```

OFFSET examples: `now`, `+1 day`, `-2 hours`, `+1 week`, `next monday`, `last friday`. FORMAT tokens: `YYYY MM DD HH mm ss`.

## Per-file step index

This index lists every public step grouped by source file, with one Gherkin example per step. It is generated from the JSDoc above each step definition. For 5+ examples per step, see the JSDoc in the source file directly.

### a11y.steps.js

- *^every image should have an alt attribute$*  ·  Example: `Then every image should have an alt attribute`
- *^every form field should have an accessible label$*  ·  Example: `Then every form field should have an accessible label`
- *^the page should have a main landmark$*  ·  Example: `Then the page should have a main landmark`
- *^the page should have a navigation landmark$*  ·  Example: `Then the page should have a navigation landmark`
- *^the page should have exactly one h1$*  ·  Example: `Then the page should have exactly one h1`
- *^the focused element should match "([^"]*)"$*  ·  Example: `Then the focused element should match "#email"`
- *^the focused element should be labeled "([^"]*)"$*  ·  Example: `Then the focused element should be labeled "Email"`
- *^the page should declare a language$*  ·  Example: `Then the page should declare a language`
- *^the page language should be "([^"]*)"$*  ·  Example: `Then the page language should be "en"`
- *^the heading hierarchy should be valid$*  ·  Example: `Then the heading hierarchy should be valid`
- *^the page should have a skip link$*  ·  Example: `Then the page should have a skip link`
- *^every button should have an accessible name$*  ·  Example: `Then every button should have an accessible name`
- *^every link should have an accessible name$*  ·  Example: `Then every link should have an accessible name`
- *^no element should have a positive tabindex$*  ·  Example: `Then no element should have a positive tabindex`
- *^every ARIA reference should resolve$*  ·  Example: `Then every ARIA reference should resolve`
- *^every ARIA role should be valid$*  ·  Example: `Then every ARIA role should be valid`
- *^required fields should be consistently marked$*  ·  Example: `Then required fields should be consistently marked`
- *^the page should have a title$*  ·  Example: `Then the page should have a title`
- *^user zoom should be allowed$*  ·  Example: `Then user zoom should be allowed`
- *^the page should pass an accessibility audit(?: at level "(A|AA|AAA)")?$*  ·  Example: `Then the page should pass an accessibility audit`
- *^the page should have no (critical|serious|moderate|minor) accessibility violations$*  ·  Example: `Then the page should have no critical accessibility violations`
- *^the element "([^"]*)" should pass an accessibility audit$*  ·  Example: `Then the element "main" should pass an accessibility audit`
- *^the page should pass an accessibility audit excluding "([^"]*)"$*  ·  Example: `Then the page should pass an accessibility audit excluding "iframe.payment"`
- *^the page should not violate the accessibility rule "([^"]*)"$*  ·  Example: `Then the page should not violate the accessibility rule "color-contrast"`
- *^(I |we )*print accessibility violations$*  ·  Example: `Then I print accessibility violations`
- *^the page should pass the accessibility rules "([^"]*)"$*  ·  Example: `Then the page should pass the accessibility rules "image-alt, label"`

### action.steps.js

- *^(I |we )*press( the)* "([^"]*)?"( button)*$*  ·  Example: `When I press "Log In"`
- *^(I |we )*press "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `When I press "btn-pressid" by attr`
- *^(I |we )*click "([^"]*)?"$*  ·  Example: `When I click "Contact Us"`
- *^(I |we )*click "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `When I click "#about-us-id" by attr`
- *^(I |we )*click "([^"]*)?" in( the)* "([^"]*)?" row$*  ·  Example: `When I click "Edit" in the "John Smith" row`
- *^(I |we )*follow "([^"]*)"$*  ·  Example: `When I follow "Contact Us"`
- *^(I |we )*attach( the)* file "([^"]*)?" to "([^"]*)?"$*  ·  Example: `When I attach the file "profile-icon.jpg" to "#profile-icon-upload"`

### api.steps.js

- *^(?:I am|we are) authenticating as "([^"]*)" with "([^"]*)" password$*  ·  Example: `Given I am authenticating as "admin" with "password123" password`
- *^(?:I |we )?set header "([^"]*)" with value "([^"]*)"$*  ·  Example: `Given I set header "Content-Type" with value "application/json"`
- *^(?:the API base URL is|I set the API base URL to|the base URL is) "([^"]*)"$*  ·  Example: `Given the API base URL is "https://jsonplaceholder.typicode.com"`
- *^(?:I set the header|we set the header|the header) "([^"]*)" (?:to|is) "([^"]*)"$*  ·  Example: `Given I set the header "Content-Type" to "application/json"`
- *^(?:I|we) set the following headers:$*  ·  Example: `Given I set the following headers:`
- *^(?:I set the request body to|we set the request body to|the request body is) '([^']*)'$*  ·  Example: `Given I set the request body to '{"name": "John", "email": "john@example.com"}'`
- *^(?:I|we) set the request body with:$*  ·  Example: `Given I set the request body with:`
- *^(?:I |we )?send a ([A-Z]+) request to "([^"]+)"$*  ·  Example: `When I send a GET request to "/users"`
- *^(?:I |we )?send a ([A-Z]+) request to "([^"]+)" with values:$*  ·  Example: `When I send a POST request to "/users" with values:`
- *^(?:I |we )?send a ([A-Z]+) request to "([^"]+)" with body:$*  ·  Example: `When I send a POST request to "/users" with body:`
- *^(?:I |we )?send a ([A-Z]+) request to "([^"]+)" with form data:$*  ·  Example: `When I send a POST request to "/login" with form data:`
- *^(?:the )?API response code should be (\d+)$*  ·  Example: `Then the API response code should be 200`
- *^(?:the )?API response should contain "([^"]*)"$*  ·  Example: `Then the API response should contain "success"`
- *^(?:the )?API response should not contain "([^"]*)"$*  ·  Example: `Then the API response should not contain "error"`
- *^(?:the )?API response should contain json:$*  ·  Example: `Then the API response should contain json:`
- *^(?:the JSON response should have|the API response should have|the JSON property) "([^"]*)" (?:equal to|should be) (.+)$*  ·  Example: `Then the JSON response should have "name" equal to "John Doe"`
- *^(?:the JSON response should have property|the API response should contain property) "([^"]*)"$*  ·  Example: `Then the JSON response should have property "id"`
- *^(?:the JSON response should not have property|the API response should not contain property) "([^"]*)"$*  ·  Example: `Then the JSON response should not have property "password"`
- *^(?:the response should be valid JSON|the API response should be valid JSON)$*  ·  Example: `Then the response should be valid JSON`
- *^(?:the response header|the header) "([^"]*)" should (?:be|contain) "([^"]*)"$*  ·  Example: `Then the response header "Content-Type" should be "application/json"`
- *^print API response$*  ·  Example: `Then print API response`
- *^(?:I|we) set placeholder "([^"]*)" to "([^"]*)"$*  ·  Example: `Given I set placeholder "{{userId}}" to "123"`

### assertion.steps.js

- *^(I |we )*should( not)* see "([^"]*)?"$*  ·  Example: `Then I should see "Welcome"`
- *^(I |we )*should( not)* see text matching "([^"]*)?"$*  ·  Example: `Then I should see text matching "^T\w+"`
- *^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" row$*  ·  Example: `Then I should see "Active" in the "John Smith" row`
- *^(I |we )*should( not)* see (a|an) "([^"]*)?" element$*  ·  Example: `Then I should see a "Username" element`
- *^(I |we )*should( not)* see (a|an) "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `Then I should see a "uname" element by its "id" attr`
- *^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element$*  ·  Example: `Then I should see "John Smith" in the "Username" element`
- *^(I |we )*should( not)* see "([^"]*)?" in( the)* "([^"]*)?" element by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `Then I should see "John Smith" in the "uname" element by its "id" attr`
- *^(I |we )*should( not)* see text matching "([^"]*)?" in( the)* "([^"]*)?" element$*  ·  Example: `Then I should see text matching "\d{4}" in the "#year" element`
- *^(the )*"([^"]*)?" element should( not)* contain "([^"]*)?"$*  ·  Example: `Then the "body" element should contain "color:white;"`
- *^(I |we )*should see (\d+) "([^"]*)" elements?$*  ·  Example: `Then I should see 3 "li" elements`
- *^(the )*"([^"]*)?" link should contain "([^"]*)?"$*  ·  Example: `Then the "Login" link should contain "/log-in"`
- *^(the )*"([^"]*)?" link should contain "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `Then the "#about-us-id" link should contain "about" by attr`
- *^(the )*response should( not)* contain "([^"]*)?"$*  ·  Example: `Then the response should contain "Welcome visitor"`
- *^(the )*response status code should( not)* be (\d+)$*  ·  Example: `Then the response status code should be 200`

### auth.steps.js

- *^(I |we )*save the auth state to "([^"]*)"$*  ·  Example: `When I save the auth state to "tests/auth/admin.json"`
- *^(I |we )*restore the auth state from "([^"]*)"$*  ·  Example: `Given I restore the auth state from "tests/auth/admin.json"`
- *^(I |we )*clear the auth state$*  ·  Example: `Given I clear the auth state`

### clock.steps.js

- *^the system time is "([^"]*)"$*  ·  Example: `Given the system time is "2026-05-08T10:00:00Z"`
- *^(I |we )*advance the clock by (\d+) ?ms$*  ·  Example: `When I advance the clock by 500 ms`
- *^(I |we )*advance the clock by (\d+) seconds?$*  ·  Example: `When I advance the clock by 30 seconds`
- *^(I |we )*advance the clock by (\d+) minutes?$*  ·  Example: `When I advance the clock by 5 minutes`
- *^(I |we )*pause the clock$*  ·  Example: `When I pause the clock`
- *^(I |we )*resume the clock$*  ·  Example: `When I resume the clock`
- *^(I |we )*set the system time to "([^"]*)"$*  ·  Example: `When I set the system time to "2026-05-08T12:30:00Z"`

### cookie.steps.js

- *a cookie with the name {string} should exist*  ·  Example: `Then a cookie with the name "session_id" should exist`
- *a cookie with the name {string} and the value {string} should exist*  ·  Example: `Then a cookie with the name "lang" and the value "en" should exist`
- *a cookie with the name {string} and a value containing {string} should exist*  ·  Example: `Then a cookie with the name "session_id" and a value containing "abc" should exist`
- *a cookie with a name containing {string} should exist*  ·  Example: `Then a cookie with a name containing "session" should exist`
- *a cookie with a name containing {string} and the value {string} should exist*  ·  Example: `Then a cookie with a name containing "session" and the value "active" should exist`
- *a cookie with a name containing {string} and a value containing {string} should exist*  ·  Example: `Then a cookie with a name containing "session" and a value containing "active" should exist`
- *a cookie with the name {string} should not exist*  ·  Example: `Then a cookie with the name "session_id" should not exist`
- *a cookie with the name {string} and the value {string} should not exist*  ·  Example: `Then a cookie with the name "lang" and the value "fr" should not exist`
- *a cookie with the name {string} and a value containing {string} should not exist*  ·  Example: `Then a cookie with the name "preferences" and a value containing "lightmode" should not exist`
- *a cookie with a name containing {string} should not exist*  ·  Example: `Then a cookie with a name containing "old_" should not exist`
- *a cookie with a name containing {string} and the value {string} should not exist*  ·  Example: `Then a cookie with a name containing "session" and the value "expired" should not exist`
- *a cookie with a name containing {string} and a value containing {string} should not exist*  ·  Example: `Then a cookie with a name containing "session" and a value containing "old" should not exist`

### debug.steps.js

- *^print current URL$*  ·  Example: `Then print current URL`
- *^print last response$*  ·  Example: `Then print last response`

### dialog.steps.js

- *^(I |we )*will accept the next dialog$*  ·  Example: `Given I will accept the next dialog`
- *^(I |we )*will dismiss the next dialog$*  ·  Example: `Given I will dismiss the next dialog`
- *^(I |we )*will accept the next dialog with "([^"]*)"$*  ·  Example: `Given I will accept the next dialog with "alice@example.com"`
- *^the last dialog message should be "([^"]*)"$*  ·  Example: `Then the last dialog message should be "Are you sure?"`
- *^the last dialog message should contain "([^"]*)"$*  ·  Example: `Then the last dialog message should contain "Are you sure"`
- *^the last dialog type should be "([^"]*)"$*  ·  Example: `Then the last dialog type should be "confirm"`
- *^(I |we )*accept all confirmation dialogs$*  ·  Example: `Given I accept all confirmation dialogs`
- *^(I |we )*do not accept any confirmation dialogs$*  ·  Example: `Given I do not accept any confirmation dialogs`

### element.steps.js

- *the element {string} should appear after the element {string}*  ·  Example: `Then the element "#footer" should appear after the element "#main"`
- *the text {string} should appear after the text {string}*  ·  Example: `Then the text "Sign in" should appear after the text "Welcome"`
- *the element {string} with the attribute {string} and the value {string} should exist*  ·  Example: `Then the element "a" with the attribute "href" and the value "/about" should exist`
- *the element {string} with the attribute {string} and the value containing {string} should exist*  ·  Example: `Then the element "a" with the attribute "href" and the value containing "/about" should exist`
- *the element {string} with the attribute {string} and the value {string} should not exist*  ·  Example: `Then the element "a" with the attribute "href" and the value "/admin" should not exist`
- *the element {string} with the attribute {string} and the value containing {string} should not exist*  ·  Example: `Then the element "a" with the attribute "href" and the value containing "/old" should not exist`
- *the element {string} should be at the top of the viewport*  ·  Example: `Then the element "#header" should be at the top of the viewport`
- *the element {string} should be centered in the viewport*  ·  Example: `Then the element ".hero" should be centered in the viewport`
- *^(I |we )*click on the element "([^"]*)"$*  ·  Example: `When I click on the element "#sign-in"`
- *^(I |we )*trigger the JS event "([^"]*)" on the element "([^"]*)"$*  ·  Example: `When I trigger the JS event "click" on the element "#cta"`
- *^(I |we )*scroll to the element "([^"]*)"$*  ·  Example: `When I scroll to the element "#footer"`
- *^(I |we )*hover over the element "([^"]*)"$*  ·  Example: `When I hover over the element ".tooltip-trigger"`
- *^(I |we )*focus on the element "([^"]*)"$*  ·  Example: `When I focus on the element "#email"`
- *the element {string} should be displayed*  ·  Example: `Then the element "#dashboard" should be displayed`
- *the element {string} should not be displayed*  ·  Example: `Then the element "#loading-spinner" should not be displayed`
- *the element {string} should be displayed within a viewport*  ·  Example: `Then the element "#hero" should be displayed within a viewport`
- *the element {string} should be displayed within a viewport with a top offset of {int} pixels*  ·  Example: `Then the element "#hero" should be displayed within a viewport with a top offset of 60 pixels`
- *the element {string} should not be displayed within a viewport with a top offset of {int} pixels*  ·  Example: `Then the element "#footer" should not be displayed within a viewport with a top offset of 60 pixels`
- *the element {string} should not be displayed within a viewport*  ·  Example: `Then the element "#footer" should not be displayed within a viewport`

### field.steps.js

- *the field {string} should be empty*  ·  Example: `Then the field "username" should be empty`
- *the field {string} should not be empty*  ·  Example: `Then the field "username" should not be empty`
- *the field {string} should exist*  ·  Example: `Then the field "username" should exist`
- *the field {string} should not exist*  ·  Example: `Then the field "missing-field" should not exist`
- *the field {string} should have {string} state*  ·  Example: `Then the field "username" should have "enabled" state`
- *the field {string} should be required*  ·  Example: `Then the field "username" should be required`
- *the field {string} should not be required*  ·  Example: `Then the field "bio" should not be required`
- *^(I |we )*fill in the multi-value field "([^"]*)" with the following values:$*  ·  Example: `When I fill in the multi-value field "tags" with the following values:`
- *^(I |we )*fill in the color field "([^"]*)" with the value "([^"]*)"$*  ·  Example: `When I fill in the color field "favorite" with the value "#ff0000"`
- *the color field {string} should have the value {string}*  ·  Example: `Then the color field "favorite" should have the value "#ff0000"`
- *^(I |we )*fill in the WYSIWYG field "([^"]*)" with the "([^"]*)"$*  ·  Example: `When I fill in the WYSIWYG field "body" with the "Hello world"`
- *the option {string} should exist within the select element {string}*  ·  Example: `Then the option "Mercedes" should exist within the select element "#cars"`
- *the option {string} should not exist within the select element {string}*  ·  Example: `Then the option "Manager" should not exist within the select element "#role"`
- *the option {string} should be selected within the select element {string}*  ·  Example: `Then the option "Mercedes" should be selected within the select element "#cars"`
- *the option {string} should not be selected within the select element {string}*  ·  Example: `Then the option "Admin" should not be selected within the select element "#role"`
- *^(I |we )*unselect "([^"]*)" from "([^"]*)"$*  ·  Example: `When I unselect "Red" from "#colors"`
- *^(I |we )*clear the select "([^"]*)"$*  ·  Example: `When I clear the select "#colors"`
- *^(I |we )*check the checkbox "([^"]*)"$*  ·  Example: `When I check the checkbox "#agree"`
- *^(I |we )*uncheck the checkbox "([^"]*)"$*  ·  Example: `When I uncheck the checkbox "#newsletter"`
- *^(I |we )*choose the radio button "([^"]*)"$*  ·  Example: `When I choose the radio button "#gender-male"`
- *^(I |we )*fill in the field "([^"]*)" with "([^"]*)"$*  ·  Example: `When I fill in the field "#username" with "alice"`
- *browser validation for the form {string} is disabled*  ·  Example: `Given browser validation for the form "#signup" is disabled`
- *^(I |we )*fill in the datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$*  ·  Example: `When I fill in the datetime field "Start" with date "2026-05-08" and time "10:00"`
- *^(I |we )*fill in the date part of the datetime field "([^"]*)" with "([^"]*)"$*  ·  Example: `When I fill in the date part of the datetime field "Start" with "2026-05-08"`
- *^(I |we )*fill in the time part of the datetime field "([^"]*)" with "([^"]*)"$*  ·  Example: `When I fill in the time part of the datetime field "Start" with "10:00"`
- *^(I |we )*fill in the start datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$*  ·  Example: `When I fill in the start datetime field "Event" with date "2026-05-08" and time "10:00"`
- *^(I |we )*fill in the end datetime field "([^"]*)" with date "([^"]*)" and time "([^"]*)"$*  ·  Example: `When I fill in the end datetime field "Event" with date "2026-05-09" and time "18:00"`

### file-download.steps.js

- *^(I |we )*download the file from the URL "([^"]*)"$*  ·  Example: `When I download the file from the URL "/exports/users.csv"`
- *^(I |we )*download the file from the link "([^"]*)"$*  ·  Example: `When I download the file from the link "Download report"`
- *the downloaded file should contain:*  ·  Example: `Then the downloaded file should contain:`
- *the downloaded file name should be {string}*  ·  Example: `Then the downloaded file name should be "report.pdf"`
- *the downloaded file name should contain {string}*  ·  Example: `Then the downloaded file name should contain "report"`
- *the downloaded file should be a zip archive containing the following files named:*  ·  Example: `Then the downloaded file should be a zip archive containing the following files named:`
- *the downloaded file should be a zip archive containing the following files partially named:*  ·  Example: `Then the downloaded file should be a zip archive containing the following files partially named:`
- *the downloaded file should be a zip archive not containing the following files partially named:*  ·  Example: `Then the downloaded file should be a zip archive not containing the following files partially named:`

### form.steps.js

- *^(I |we )*fill in "([^"]*)?" with "([^"]*)?"$*  ·  Example: `When I fill in "Username" with "John Smith"`
- *^(I |we )*fill in "([^"]*)?" with "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `When I fill in "#uname" with "John Smith" by attr`
- *^(I |we )*fill in "([^"]*)?" with:$*  ·  Example: `When I fill in "Username" with:`
- *^(I |we )*fill in "([^"]*)?" with: by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `When I fill in "#uname" with: by attr`
- *^(I |we )*fill in "([^"]*)?" for "([^"]*)?"$*  ·  Example: `When I fill in "jon-smith" for "Username"`
- *^(I |we )*fill in "([^"]*)?" for "([^"]*)?" by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `When I fill in "John Smith" for "#uname" by attr`
- *^(I |we )*fill in( the)* following:$*  ·  Example: `When I fill in the following:`
- *^(I |we )*fill in( the)* following: by( its)*(?: "([^"]*)?")* (attribute|attr)$*  ·  Example: `When I fill in the following: by attr`
- *^(I |we )*select "([^"]*)?" from "([^"]*)?"$*  ·  Example: `When I select "Mercedes" from "Cars"`
- *^(I |we )*additionally select "([^"]*)" from "([^"]*)"$*  ·  Example: `When I additionally select "Red" from "Colors"`
- *^(I |we )*check "([^"]*)?"$*  ·  Example: `When I check "Remember me"`
- *^(I |we )*uncheck "([^"]*)?"$*  ·  Example: `When I uncheck "Remember me"`
- *^(I |we )*select radio button "([^"]*)?"$*  ·  Example: `When I select radio button "Male"`

### iframe.steps.js

- *^(I |we )*switch to (the )?iframe "([^"]*)"$*  ·  Example: `When I switch to iframe "iframe.payment"`
- *^(I |we )*switch to iframe with locator "([^"]*)"$*  ·  Example: `When I switch to iframe with locator "iframe.payment"`
- *^(I |we )*switch to the root document$*  ·  Example: `When I switch to the root document`
- *^(I |we )*switch to the iframe with title "([^"]*)"$*  ·  Example: `When I switch to the iframe with title "Payment"`
- *^(I |we )*switch to the iframe with name "([^"]*)"$*  ·  Example: `When I switch to the iframe with name "payment"`
- *^(I |we )*click "([^"]*)" inside the iframe$*  ·  Example: `When I click "Confirm" inside the iframe`
- *^(I |we )*click "([^"]*)" by attr inside the iframe$*  ·  Example: `When I click "submit-btn" by attr inside the iframe`
- *^(I |we )*fill in "([^"]*)" with "([^"]*)" inside the iframe$*  ·  Example: `When I fill in "card_number" with "4242 4242 4242 4242" inside the iframe`
- *^I should see "([^"]*)" inside the iframe$*  ·  Example: `Then I should see "Payment received" inside the iframe`
- *^I should not see "([^"]*)" inside the iframe$*  ·  Example: `Then I should not see "Error" inside the iframe`

### input.steps.js

- *^(I |we )*hover over "([^"]*)"$*  ·  Example: `When I hover over "#nav-products"`
- *^(I |we )*move the pointer to "([^"]*)"$*  ·  Example: `When I move the pointer to "#cta"`
- *^(I |we )*double[- ]click on "([^"]*)"$*  ·  Example: `When I double-click on "#row-1"`
- *^(I |we )*right[- ]click on "([^"]*)"$*  ·  Example: `When I right-click on "#row-1"`
- *^(I |we )*middle[- ]click on "([^"]*)"$*  ·  Example: `When I middle-click on "a.external"`
- *^(I |we )*click on "([^"]*)" while holding "([^"]*)"$*  ·  Example: `When I click on "#row-1" while holding "Shift"`
- *^(I |we )*drag "([^"]*)" to "([^"]*)"$*  ·  Example: `When I drag "#card-1" to "#column-done"`
- *^(I |we )*set the viewport size to (\d+)x(\d+)$*  ·  Example: `When I set the viewport size to 1280x720`
- *^(I |we )*tap on "([^"]*)"$*  ·  Example: `When I tap on "#cta"`

### javascript.steps.js

- *^there should be no JavaScript errors$*  ·  Example: `Then there should be no JavaScript errors`
- *^there should be no JavaScript warnings$*  ·  Example: `Then there should be no JavaScript warnings`
- *^JavaScript errors should not match "([^"]*)"$*  ·  Example: `Then JavaScript errors should not match "TypeError"`
- *^print JavaScript errors$*  ·  Example: `Then print JavaScript errors`

### keyboard.steps.js

- *^(I |we )*press the key "([^"]*)"$*  ·  Example: `When I press the key "Enter"`
- *^(I |we )*press the key "([^"]*)" on the element "([^"]*)"$*  ·  Example: `When I press the key "Enter" on the element "#search"`
- *^(I |we )*press the keys "([^"]*)"$*  ·  Example: `When I press the keys "Control+a"`
- *^(I |we )*press the keys "([^"]*)" on the element "([^"]*)"$*  ·  Example: `When I press the keys "Control+a" on the element "#editor"`

### link.steps.js

- *the link {string} with the href {string} should exist*  ·  Example: `Then the link "About" with the href "/about" should exist`
- *the link {string} with the href {string} within the element {string} should exist*  ·  Example: `Then the link "Home" with the href "/" within the element "#main-nav" should exist`
- *the link {string} with the href {string} should not exist*  ·  Example: `Then the link "Sign in" with the href "/login" should not exist`
- *the link {string} with the href {string} within the element {string} should not exist*  ·  Example: `Then the link "Logout" with the href "/logout" within the element ".guest-nav" should not exist`
- *the link with the title {string} should exist*  ·  Example: `Then the link with the title "Open menu" should exist`
- *the link with the title {string} should not exist*  ·  Example: `Then the link with the title "Delete user" should not exist`
- *the link {string} should be an absolute link*  ·  Example: `Then the link "Twitter" should be an absolute link`
- *the link {string} should not be an absolute link*  ·  Example: `Then the link "Home" should not be an absolute link`
- *^(I |we )*click on the link with the title "([^"]*)"$*  ·  Example: `When I click on the link with the title "Open menu"`

### metatag.steps.js

- *the meta tag should exist with the following attributes:*  ·  Example: `Then the meta tag should exist with the following attributes:`
- *the meta tag should not exist with the following attributes:*  ·  Example: `Then the meta tag should not exist with the following attributes:`
- *the {string} meta tag should not contain any HTML tags*  ·  Example: `Then the "description" meta tag should not contain any HTML tags`

### modal.steps.js

- *^(I |we )*should( not)* see (a |the )*modal( dialog)*$*  ·  Example: `Then I should see a modal`
- *^(I |we )*should( not)* see (a |the )*modal with title "([^"]*)?"$*  ·  Example: `Then I should see a modal with title "Confirm Action"`
- *^(I |we )*should( not)* see (a |the )*"([^"]*)?" modal$*  ·  Example: `Then I should see a "confirmation-modal" modal`
- *^(I |we )*should( not)* see "([^"]*)?" in( the)* modal( dialog)*$*  ·  Example: `Then I should see "Are you sure?" in the modal`
- *the modal should contain {string}*  ·  Example: `Then the modal should contain "Welcome modal text"`
- *the modal should not contain {string}*  ·  Example: `Then the modal should not contain "Goodbye"`
- *^(I |we )*click "([^"]*)?"( button)* in( the)* modal( dialog)*$*  ·  Example: `When I click "Confirm" in the modal`
- *^(I |we )*click on "([^"]*)" in the modal$*  ·  Example: `When I click on "#close-btn" in the modal`
- *^(I |we )*(close|dismiss)( the)* modal( dialog)*$*  ·  Example: `When I close the modal`

### navigation.steps.js

- *^(I am |we are )?an anonymous user$*  ·  Example: `Given I am an anonymous user`
- *^(I am |we are )?on( the)* (homepage|frontpage)$*  ·  Example: `Given I am on homepage`
- *^(I am |we are )*on( the)* "([^"]*)?"( page)*$*  ·  Example: `Given I am on "/about-us.html"`
- *^(I go |I navigate |we go |we navigate |navigating )?to( the)* (homepage|frontpage)$*  ·  Example: `When I go to homepage`
- *^(I go |I navigate |we go |we navigate |navigating )?to "([^"]*)?"$*  ·  Example: `When I go to "/contact-us.html"`
- *^(I |we )*move forward one page$*  ·  Example: `When I move forward one page`
- *^(I |we )*move backward one page$*  ·  Example: `When I move backward one page`
- *^(I |we )*reload( the)*( page)*$*  ·  Example: `When I reload`
- *^(I |we )*should( not)* be on( the)* (homepage|frontpage)$*  ·  Example: `Then I should be on homepage`
- *^(I |we )*should( not)* be on( the)* "([^"]*)?"( page)*$*  ·  Example: `Then I should be on "/"`
- *^(the )*url should( not)* match "([^"]*)?"$*  ·  Example: `Then the url should match "/contact-us.html"`

### network.steps.js

- *^the URL "([^"]*)" returns the JSON:$*  ·  Example: `Given the URL "**\/api/users" returns the JSON:`
- *^the URL "([^"]*)" returns status (\d+)(?: with body "([^"]*)")?$*  ·  Example: `Given the URL "**\/api/login" returns status 401 with body "Unauthorized"`
- *^the URL "([^"]*)" is blocked$*  ·  Example: `Given the URL "**\/analytics.js" is blocked`
- *^the URL "([^"]*)" is delayed by (\d+) ?ms$*  ·  Example: `Given the URL "**\/api/**" is delayed by 1500 ms`
- *^the network is offline$*  ·  Example: `Given the network is offline`
- *^the network is online$*  ·  Example: `Given the network is online`
- *^(I |we )*start recording network requests$*  ·  Example: `Given I start recording network requests`
- *^a request to "([^"]*)" should have been made$*  ·  Example: `Then a request to "**\/api/users" should have been made`
- *^a (GET|POST|PUT|PATCH|DELETE) request to "([^"]*)" should have been made$*  ·  Example: `Then a GET request to "**\/api/users" should have been made`
- *^no request to "([^"]*)" should have been made$*  ·  Example: `Then no request to "**\/tracking" should have been made`

### path.steps.js

- *the path should be {string}*  ·  Example: `Then the path should be "/dashboard"`
- *the path should not be {string}*  ·  Example: `Then the path should not be "/login"`
- *current url should have the {string} parameter*  ·  Example: `Then current url should have the "lang" parameter`
- *current url should have the {string} parameter with the {string} value*  ·  Example: `Then current url should have the "lang" parameter with the "en" value`
- *current url should not have the {string} parameter*  ·  Example: `Then current url should not have the "missing" parameter`
- *current url should not have the {string} parameter with the {string} value*  ·  Example: `Then current url should not have the "lang" parameter with the "fr" value`
- *the basic authentication with the username {string} and the password {string}*  ·  Example: `Given the basic authentication with the username "admin" and the password "secret"`
- *^(I |we )*go back$*  ·  Example: `When I go back`

### response.steps.js

- *the response should contain the header {string}*  ·  Example: `Then the response should contain the header "content-type"`
- *the response should not contain the header {string}*  ·  Example: `Then the response should not contain the header "x-fake-header"`
- *the response header {string} should contain the value {string}*  ·  Example: `Then the response header "content-type" should contain the value "html"`
- *the response header {string} should not contain the value {string}*  ·  Example: `Then the response header "content-type" should not contain the value "application/json"`

### responsive.steps.js

- *the following responsive breakpoints:*  ·  Example: `Given the following responsive breakpoints:`
- *^(I |we )*set the viewport to the "([^"]*)" breakpoint$*  ·  Example: `When I set the viewport to the "mobile" breakpoint`
- *^(I |we )*set the viewport width to (\d+)$*  ·  Example: `When I set the viewport width to 1200`
- *^(I |we )*set the viewport height to (\d+)$*  ·  Example: `When I set the viewport height to 800`
- *^(I |we )*set the viewport to (\d+) by (\d+)$*  ·  Example: `When I set the viewport to 1200 by 800`

### rest.steps.js

- *a REST header {string} with value {string}*  ·  Example: `Given a REST header "Authorization" with value "Bearer abc123"`
- *^(I |we )*send a REST "([^"]*)" request to "([^"]*)"$*  ·  Example: `When I send a REST "GET" request to "/api/users"`
- *^(I |we )*send a REST "([^"]*)" request to "([^"]*)" with body:$*  ·  Example: `When I send a REST "POST" request to "/api/users" with body:`
- *the REST response status code should be {int}*  ·  Example: `Then the REST response status code should be 200`
- *the REST response should contain {string}*  ·  Example: `Then the REST response should contain "Alice"`

### screenshot.steps.js

- *^(I |we )*save screenshot$*  ·  Example: `Then I save screenshot`
- *^(I |we )*save fullscreen screenshot$*  ·  Example: `Then I save fullscreen screenshot`
- *^(I |we )*save (\d+) x (\d+) screenshot$*  ·  Example: `Then I save 1440 x 900 screenshot`
- *^(I |we )*save fullscreen (\d+) x (\d+) screenshot$*  ·  Example: `Then I save fullscreen 1440 x 900 screenshot`
- *^(I |we )*save screenshot with name "([^"]*)"$*  ·  Example: `Then I save screenshot with name "homepage.png"`
- *^(I |we )*save fullscreen screenshot with name "([^"]*)"$*  ·  Example: `Then I save fullscreen screenshot with name "homepage-full.png"`

### scroll.steps.js

- *^(I scroll|we scroll|scrolling)? down(?: (\d+))?$*  ·  Example: `And I scroll down`
- *^(I scroll|we scroll|scrolling)? up(?: (\d+))?$*  ·  Example: `And I scroll up`
- *^(I scroll|we scroll|scrolling)? to( the)* top( of the page)*$*  ·  Example: `When I scroll to top`
- *^(I scroll|we scroll|scrolling)? to( the)* bottom( of the page)*$*  ·  Example: `When I scroll to the bottom`
- *^(I scroll|we scroll|scrolling)? to top of "([^"]*)"$*  ·  Example: `When I scroll to top of "#off-canvas"`
- *^(I scroll|we scroll|scrolling)? to bottom of "([^"]*)"$*  ·  Example: `When I scroll to bottom of "#off-canvas"`
- *^(I scroll|we scroll|scrolling)? right(?: (\d+))?$*  ·  Example: `And I scroll right`
- *^(I scroll|we scroll|scrolling)? left(?: (\d+))?$*  ·  Example: `And I scroll left`
- *^(I scroll|we scroll|scrolling)? to( the)* start( of the page)*$*  ·  Example: `When I scroll to start`
- *^(I scroll|we scroll|scrolling)? to( the)* end( of the page)*$*  ·  Example: `When I scroll to the end`
- *^(I scroll|we scroll|scrolling)? to start of "([^"]*)"$*  ·  Example: `When I scroll to start of "#off-canvas"`
- *^(I scroll|we scroll|scrolling)? to end of "([^"]*)"$*  ·  Example: `When I scroll to end of "#off-canvas"`

### selectors.steps.js

- *^(I |we )*add "([^"]*)" selector for "([^"]*)" css selector$*  ·  Example: `When I add "mobile logo" selector for "header img#logo" css selector`
- *^(I |we )*add "([^"]*)" selector for "([^"]*)" xpath selector$*  ·  Example: `When I add "page title" selector for "//h1[contains(@class,'page-header')]" xpath selector`
- *^(I |we )*add selectors from "([^"]*)" file$*  ·  Example: `When I add selectors from "selectors.json" file`
- *^(I |we )*print css selectors$*  ·  Example: `Then I print css selectors`
- *^(I |we )*print xpath selectors$*  ·  Example: `Then I print xpath selectors`
- *^(I |we )*define css selectors:$*  ·  Example: `Given I define css selectors:`
- *^(I |we )*define xpath selectors:$*  ·  Example: `Given I define xpath selectors:`
- *^(I am |we are )?viewing the site on a (?:"([^"]+)"|([a-zA-Z0-9 _,]+)) (?:screen|device)$*  ·  Example: `Given I am viewing the site on a xl screen`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) above ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see header above footer`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) below ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see footer below header`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) to (?:the )?left of ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see logo to the left of nav`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) to (?:the )?right of ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see nav to the right of logo`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) inside of ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see logo inside of header`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) outside of ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see header outside of logo`
- *^(I |we )*see ((?:[a-zA-Z0-9 ,\-](?!not))+) over ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see modal over content`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) not over ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see header not over content`
- *^(I |we )*see visible ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I see visible header`
- *^(I |we )*(don't|do not) see ([a-zA-Z0-9 ,\-]+)$*  ·  Example: `Then I don't see modal`
- *^(I |we )*see ([a-zA-Z0-9 ,\-]+) has focus$*  ·  Example: `Then I see search has focus`
- *^(I |we )*move focus to "([^"]*)" field$*  ·  Example: `When I move focus to "Title" field`
- *^(I |we )*select all text in "([^"]*)" field$*  ·  Example: `When I select all text in "Title" field`
- *^(I |we )*select from (\d+) to (\d+) text in "([^"]*)" field$*  ·  Example: `When I select from 0 to 5 text in "Title" field`
- *^(I |we )*select "([^"]*)" text in "([^"]*)" field$*  ·  Example: `When I select "title name" text in "Title" field`
- *^(I |we )*click (?:on |a )?([a-zA-Z0-9 ,\-]+)$*  ·  Example: `When I click nav`

### storage.steps.js

- *^(?:the cookie|cookie) "([^"]*)" is set to "([^"]*)"$*  ·  Example: `Given the cookie "session" is set to "abc123"`
- *^the cookie "([^"]*)" is removed$*  ·  Example: `Given the cookie "session" is removed`
- *^all cookies are cleared$*  ·  Example: `Given all cookies are cleared`
- *^(?:the )?local storage "([^"]*)" is set to "([^"]*)"$*  ·  Example: `Given the local storage "user" is set to "Alice"`
- *^(?:the )?local storage "([^"]*)" is removed$*  ·  Example: `Given the local storage "user" is removed`
- *^local storage is cleared$*  ·  Example: `Given local storage is cleared`
- *^(?:the )?session storage "([^"]*)" is set to "([^"]*)"$*  ·  Example: `Given the session storage "checkout step" is set to "2"`
- *^(?:the )?session storage "([^"]*)" is removed$*  ·  Example: `Given the session storage "checkout step" is removed`
- *^session storage is cleared$*  ·  Example: `Given session storage is cleared`

### table.steps.js

- *the table {string} should have {int} row(s)*  ·  Example: `Then the table "#users" should have 5 rows`
- *the table {string} should have {int} column(s)*  ·  Example: `Then the table "#users" should have 4 columns`
- *the table {string} should contain the following columns:*  ·  Example: `Then the table "#users" should contain the following columns:`
- *the table {string} should be empty*  ·  Example: `Then the table "#users" should be empty`
- *the table {string} should not be empty*  ·  Example: `Then the table "#users" should not be empty`
- *the table {string} should be sorted by {string} in {string} order*  ·  Example: `Then the table "#users" should be sorted by "Name" in "ascending" order`
- *the table {string} should contain the following rows:*  ·  Example: `Then the table "#users" should contain the following rows:`
- *the {string} row should contain the following:*  ·  Example: `Then the "Alice" row should contain the following:`

### wait.steps.js

- *^(I |we )*wait for (\d+) seconds?$*  ·  Example: `When I wait for 1 second`
- *^(I |we )*wait for (\d+) seconds? for AJAX to finish$*  ·  Example: `When I wait for 1 second for AJAX to finish`
- *^(I |we )*wait (\d+)( second| seconds|s)?$*  ·  Example: `When I wait 1 second`
- *^(I |we )*wait max of (\d+)( second| seconds|s)?$*  ·  Example: `When I wait max of 1 second`
- *^(I |we )*wait (\d+)( minute| minutes|m)?$*  ·  Example: `When I wait 1 minute`
- *^(I |we )*wait max of (\d+)( minute| minutes|m)?$*  ·  Example: `When I wait max of 1 minute`
- *^(I |we )*wait until( the)* page( is)* loaded*$*  ·  Example: `When I wait until the page is loaded`
- *^(I |we )*wait for AJAX to finish$*  ·  Example: `When I wait for AJAX to finish`
- *^(I |we )*wait for( the)* modal( dialog)* to (appear|disappear)$*  ·  Example: `When I wait for the modal to appear`
- *^(I |we )*wait for "([^"]*)" to appear$*  ·  Example: `When I wait for "#dashboard" to appear`
- *^(I |we )*wait for "([^"]*)" to disappear$*  ·  Example: `When I wait for "#loading-spinner" to disappear`
- *^(I |we )*wait for( the)* text "([^"]*)" to appear$*  ·  Example: `When I wait for the text "Dashboard" to appear`
- *^(I |we )*wait for( the)* text "([^"]*)" to disappear$*  ·  Example: `When I wait for the text "Loading…" to disappear`
- *^(I |we )*wait until( the)* URL contains "([^"]*)"$*  ·  Example: `When I wait until the URL contains "/dashboard"`
- *^(I |we )*wait until( the)* page title (is|contains) "([^"]*)"$*  ·  Example: `When I wait until the page title is "Dashboard - MyApp"`
- *^(I |we )*wait until (\d+) elements? match(?:es)? "([^"]*)"$*  ·  Example: `When I wait until 5 elements match ".product-card"`
- *^(I |we )*wait until at least (\d+) elements? match(?:es)? "([^"]*)"$*  ·  Example: `When I wait until at least 3 elements match ".item"`
- *^(I |we )*wait until (the network is idle|requests are complete|network goes quiet)$*  ·  Example: `When I wait until the network is idle`
- *^(I |we )*wait until( the)* page is interactive$*  ·  Example: `When I wait until the page is interactive`
- *^(I |we )*wait until pending timers settle$*  ·  Example: `When I wait until pending timers settle`
- *^eventually (I |we )*should see "([^"]*)"(?: within (\d+) seconds?)?$*  ·  Example: `Then eventually I should see "Done"`

### web-first.steps.js

- *^"([^"]*)" should be (visible|hidden|attached|focused|enabled|disabled|editable)(?: within (\d+) seconds?)?$*  ·  Example: `Then "#dashboard" should be visible`
- *^"([^"]*)" should not be (visible|hidden|attached|focused|enabled|disabled|editable)(?: within (\d+) seconds?)?$*  ·  Example: `Then "#loading-spinner" should not be visible`
- *^"([^"]*)" should be in the viewport(?: within (\d+) seconds?)?$*  ·  Example: `Then "#hero" should be in the viewport`
- *^"([^"]*)" should not be in the viewport(?: within (\d+) seconds?)?$*  ·  Example: `Then "#footer" should not be in the viewport`
- *^"([^"]*)" should have a count of (\d+)(?: within (\d+) seconds?)?$*  ·  Example: `Then ".product-card" should have a count of 12`
- *^"([^"]*)" should have text "([^"]*)"(?: within (\d+) seconds?)?$*  ·  Example: `Then "h1" should have text "Welcome"`
- *^"([^"]*)" should contain text "([^"]*)"(?: within (\d+) seconds?)?$*  ·  Example: `Then "h1" should contain text "Welcome"`
- *^"([^"]*)" should have value "([^"]*)"(?: within (\d+) seconds?)?$*  ·  Example: `Then "#email" should have value "alice@example.com"`
- *^"([^"]*)" should have attribute "([^"]*)" with value "([^"]*)"(?: within (\d+) seconds?)?$*  ·  Example: `Then "#tab-1" should have attribute "aria-selected" with value "true"`
- *^"([^"]*)" should have class "([^"]*)"(?: within (\d+) seconds?)?$*  ·  Example: `Then "#tab-1" should have class "is-active"`
- *^(I |we )*click the "([^"]*)" (button|link|tab|menuitem|checkbox|radio|option)$*  ·  Example: `When I click the "Sign in" button`
- *^the "([^"]*)" (button|link|tab|menuitem|checkbox|radio|option) should be visible(?: within (\d+) seconds?)?$*  ·  Example: `Then the "Save changes" button should be visible`

### xml.steps.js

- *the response content from the file {string}*  ·  Example: `Given the response content from the file "feed.xml"`
- *the response content is the following:*  ·  Example: `Given the response content is the following:`
- *the response should be in XML format*  ·  Example: `Then the response should be in XML format`
- *the response should not be in XML format*  ·  Example: `Then the response should not be in XML format`
- *the XML element {string} should exist*  ·  Example: `Then the XML element "/root/item" should exist`
- *the XML element {string} should not exist*  ·  Example: `Then the XML element "/root/missing" should not exist`
- *the XML element {string} should be equal to {string}*  ·  Example: `Then the XML element "/root/item" should be equal to "Hello"`
- *the XML element {string} should not be equal to {string}*  ·  Example: `Then the XML element "/root/item" should not be equal to "Bye"`
- *the XML element {string} should contain {string}*  ·  Example: `Then the XML element "/root/item" should contain "Hello"`
- *the XML element {string} should not contain {string}*  ·  Example: `Then the XML element "/root/item" should not contain "Error"`
- *the XML attribute {string} on element {string} should exist*  ·  Example: `Then the XML attribute "id" on element "/root/item" should exist`
- *the XML attribute {string} on element {string} should not exist*  ·  Example: `Then the XML attribute "deprecated" on element "/root/item" should not exist`
- *the XML attribute {string} on element {string} should be equal to {string}*  ·  Example: `Then the XML attribute "id" on element "/root/item" should be equal to "1"`
- *the XML attribute {string} on element {string} should not be equal to {string}*  ·  Example: `Then the XML attribute "id" on element "/root/item" should not be equal to "0"`
- *the XML attribute {string} on element {string} should contain {string}*  ·  Example: `Then the XML attribute "id" on element "/root/item" should contain "abc"`
- *the XML attribute {string} on element {string} should not contain {string}*  ·  Example: `Then the XML attribute "id" on element "/root/item" should not contain "old"`
- *the XML element {string} should have {int} element(s)*  ·  Example: `Then the XML element "//entry" should have 5 elements`
- *the XML should use the namespace {string}*  ·  Example: `Then the XML should use the namespace "http://www.w3.org/2005/Atom"`
- *the XML should not use the namespace {string}*  ·  Example: `Then the XML should not use the namespace "http://example.com/legacy"`
- *^(I |we )*print last XML response$*  ·  Example: `When I print last XML response`

### yaml.steps.js

- *the YAML response content from the file {string}*  ·  Example: `Given the YAML response content from the file "config.yml"`
- *the YAML response content is the following:*  ·  Example: `Given the YAML response content is the following:`
- *the active YAML document is {int}*  ·  Example: `Given the active YAML document is 1`
- *the YAML response should have {int} document(s)*  ·  Example: `Then the YAML response should have 1 document`
- *the response should be in YAML format*  ·  Example: `Then the response should be in YAML format`
- *the response should not be in YAML format*  ·  Example: `Then the response should not be in YAML format`
- *the YAML should have no duplicate keys*  ·  Example: `Then the YAML should have no duplicate keys`
- *the YAML element {string} should exist*  ·  Example: `Then the YAML element "/name" should exist`
- *the YAML element {string} should not exist*  ·  Example: `Then the YAML element "/missing" should not exist`
- *the YAML element {string} should be equal to {string}*  ·  Example: `Then the YAML element "/name" should be equal to "example"`
- *the YAML element {string} should not be equal to {string}*  ·  Example: `Then the YAML element "/name" should not be equal to "Other"`
- *the YAML element {string} should contain {string}*  ·  Example: `Then the YAML element "/name" should contain "Web"`
- *the YAML element {string} should not contain {string}*  ·  Example: `Then the YAML element "/name" should not contain "Error"`
- *the YAML attribute {string} on element {string} should exist*  ·  Example: `Then the YAML attribute "id" on element "/items/0" should exist`
- *the YAML attribute {string} on element {string} should not exist*  ·  Example: `Then the YAML attribute "deprecated" on element "/items/0" should not exist`
- *the YAML attribute {string} on element {string} should be equal to {string}*  ·  Example: `Then the YAML attribute "id" on element "/items/0" should be equal to "1"`
- *the YAML attribute {string} on element {string} should not be equal to {string}*  ·  Example: `Then the YAML attribute "id" on element "/items/0" should not be equal to "0"`
- *the YAML attribute {string} on element {string} should contain {string}*  ·  Example: `Then the YAML attribute "id" on element "/items/0" should contain "abc"`
- *the YAML attribute {string} on element {string} should not contain {string}*  ·  Example: `Then the YAML attribute "id" on element "/items/0" should not contain "old"`
- *the YAML element {string} should have {int} element(s)*  ·  Example: `Then the YAML element "/items" should have 5 elements`
- *the YAML value at {string} should be of type {string}*  ·  Example: `Then the YAML value at "/spec/replicas" should be of type "integer"`
- *the YAML value at {string} should be empty*  ·  Example: `Then the YAML value at "/labels" should be empty`
- *the YAML value at {string} should not be empty*  ·  Example: `Then the YAML value at "/items" should not be empty`
- *the YAML value at {string} should be greater than {float}*  ·  Example: `Then the YAML value at "/spec/replicas" should be greater than 0`
- *the YAML value at {string} should be greater than or equal to {float}*  ·  Example: `Then the YAML value at "/spec/replicas" should be greater than or equal to 1`
- *the YAML value at {string} should be less than {float}*  ·  Example: `Then the YAML value at "/spec/replicas" should be less than 100`
- *the YAML value at {string} should be less than or equal to {float}*  ·  Example: `Then the YAML value at "/spec/replicas" should be less than or equal to 10`
- *the YAML value at {string} should be between {float} and {float}*  ·  Example: `Then the YAML value at "/spec/replicas" should be between 1 and 10`
- *the YAML array at {string} should contain an item where {string} is {string}*  ·  Example: `Then the YAML array at "/spec/containers" should contain an item where "/name" is "nginx"`
- *the YAML array at {string} should contain no item where {string} is {string}*  ·  Example: `Then the YAML array at "/spec/containers" should contain no item where "/image" is "alpine:latest"`
- *every item in {string} should have key {string}*  ·  Example: `Then every item in "/spec/containers" should have key "image"`
- *the YAML keys at {string} should be exactly {string}*  ·  Example: `Then the YAML keys at "/metadata" should be exactly "name, namespace, labels"`
- *the YAML at {string} should have keys {string}*  ·  Example: `Then the YAML at "/metadata" should have keys "name, namespace"`
- *the YAML should match JSON Schema {string}*  ·  Example: `Then the YAML should match JSON Schema "schemas/deployment.json"`
- *the YAML should equal the file {string} ignoring keys {string}*  ·  Example: `Then the YAML should equal the file "expected.yaml" ignoring keys "/metadata/resourceVersion"`
- *the YAML should use the namespace {string}*  ·  Example: `Then the YAML should use the namespace "v1"`
- *the YAML should not use the namespace {string}*  ·  Example: `Then the YAML should not use the namespace "v0"`
- *^(I |we )*print last YAML response$*  ·  Example: `When I print last YAML response`
