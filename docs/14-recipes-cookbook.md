# Recipes Cookbook

20 paste-and-go scenarios covering the most common testing needs. Drop
them straight into a `.feature` file, swap selectors / text for your
app, run.

---

## 1. Sign in (happy path)

```gherkin
Scenario: Sign in with valid credentials
  Given I am on "/login"
  When I fill in "Email" with "alice@example.com"
   And I fill in "Password" with "s3cret"
   And I press "Sign in"
  Then I should see "Dashboard"
```

## 2. Sign in (validation error)

```gherkin
Scenario: Sign in fails with empty password
  Given I am on "/login"
  When I fill in "Email" with "alice@example.com"
   And I press "Sign in"
  Then I should see "Password is required"
   And I should be on "/login"
```

## 3. Sign up with required fields

```gherkin
Scenario: Sign up
  Given I am on "/signup"
  When I fill in the following:
    | Name      | Alice              |
    | Email     | alice@example.com  |
    | Password  | s3cret             |
   And I check "I agree to terms"
   And I press "Create account"
  Then I should see "Welcome, Alice"
```

## 4. Search

```gherkin
Scenario: Find a product by keyword
  Given I am on the homepage
  When I fill in "Search" with "laptop"
   And I press the key "Enter"
  Then ".product-card" should have a count of 12 within 5 seconds
   And I should see "Results for \"laptop\""
```

## 5. Logout

```gherkin
Scenario: Logout returns to homepage
  Given I restore the auth state from "tests/auth/admin.json"
   And I am on "/dashboard"
  When I click "Sign out"
  Then I should be on the homepage
   And I should see "Sign in"
```

## 6. Add to cart

```gherkin
Scenario: Add a product to cart
  Given I am on "/products/laptop-pro"
  When I press "Add to cart"
   And I follow "View cart"
  Then I should see "Laptop Pro" in the "Cart" element
   And the URL should match "/cart"
```

## 7. Modal open + close

```gherkin
Scenario: Open and close the help modal
  Given I am on the homepage
  When I click "Help"
   And I wait for the modal to appear
  Then I should see "How can we help?" in the modal
  When I close the modal
  Then I should not see the modal
```

## 8. Native confirm dialog

```gherkin
Scenario: Confirm deletion
  Given I am on "/admin/users"
   And I will accept the next dialog
  When I click "Delete" in the "alice@example.com" row
  Then the last dialog message should contain "delete"
   And I should see "User removed"
```

## 9. Pagination

```gherkin
Scenario: Navigate to second page of results
  Given I am on "/blog"
  When I follow "Next"
  Then current url should have the "page" parameter with the "2" value
   And ".post" should have a count of 10
```

## 10. Sortable table

```gherkin
Scenario: Sort orders by total descending
  Given I restore the auth state from "tests/auth/admin.json"
   And I am on "/admin/orders"
  When I click "Total"
   And I click "Total"
  Then the table "#orders" should be sorted by "Total" in "descending" order
```

## 11. Form file upload

```gherkin
Scenario: Upload a profile photo
  Given I restore the auth state from "tests/auth/customer.json"
   And I am on "/account"
  When I attach the file "avatar.png" to "#avatar"
   And I press "Save"
  Then I should see "Avatar updated"
```

## 12. API mock + UI assertion

```gherkin
Scenario: Dashboard renders mocked user list
  Given the URL "**/api/users" returns the JSON:
    """
    {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
    """
  When I am on "/users"
  Then ".user" should have a count of 2 within 5 seconds
   And I should see "Alice"
   And I should see "Bob"
```

## 13. Block third-party tracking

```gherkin
Scenario: Page renders without tracking scripts
  Given the URL "**/google-analytics.com/**" is blocked
   And I start recording network requests
  When I am on the homepage
  Then no request to "**/google-analytics.com/**" should have been made
```

## 14. Mobile viewport smoke

```gherkin
Scenario: Mobile menu collapses
  Given I am on the homepage
  When I set the viewport to the "mobile" breakpoint
  Then "<nav .mobile-toggle>" should be visible
   And "<nav .desktop-menu>" should not be visible
```

## 15. Accessibility AA gate

```gherkin
@a11y
Scenario: Page meets WCAG 2.1 AA
  Given I am on "/checkout"
  Then the page should pass an accessibility audit at level "AA"
   And the page should have a title
   And user zoom should be allowed
```

## 16. Keyboard navigation

```gherkin
Scenario: Tab order is correct on the login form
  Given I am on "/login"
   And I focus on the element "body"
  When I press the key "Tab"
  Then the focused element should match "#email"
  When I press the key "Tab"
  Then the focused element should match "#password"
  When I press the key "Tab"
  Then the focused element should match "button[type=submit]"
```

## 17. SPA navigation without full reload

```gherkin
Scenario: SPA route changes without full page load
  Given I am on the homepage
  When I follow "Pricing"
   And I wait until the URL contains "/pricing"
  Then I should see "Plans"
   And the page should have exactly one h1
```

## 18. Wait for AJAX-loaded content

```gherkin
Scenario: Live search returns results
  Given I am on "/search"
  When I fill in "Search" with "laptops"
  Then I wait until at least 1 element matches ".result"
   And I should see "results"
```

## 19. JSON-API response check

```gherkin
Scenario: Health endpoint returns OK
  When I send a GET request to "/api/health"
  Then the API response code should be 200
   And the JSON property "status" should be "ok"
```

## 20. End-to-end checkout (composite)

```gherkin
Scenario: Customer completes checkout
  Given I restore the auth state from "tests/auth/customer.json"
   And I am on "/products/laptop-pro"
  When I press "Add to cart"
   And I follow "Checkout"
   And I fill in the following:
     | Card number | 4242 4242 4242 4242 |
     | Expiry      | 12/30               |
     | CVV         | 123                 |
   And I press "Place order"
   And I wait until the URL contains "/orders/"
  Then I should see "Order confirmed"
   And I send a GET request to "/api/orders?latest=1"
   And the API response code should be 200
   And the JSON property "orders.0.status" should be "Pending"
```

---

## How to adapt these

1. Find the scenario closest to your goal.
2. Swap selectors (`#email`, `.product-card`, …) for your real ones.
3. Swap text labels (`"Sign in"`, `"Add to cart"`) for your real copy.
4. Run. Fix any red. Iterate.

If you find yourself rewriting the same setup three times, extract it
into a `Background:` block. If you find yourself rewriting the same
selector three times, register it in `tests/selectors/your-app.json`.

That's the entire cookbook.
