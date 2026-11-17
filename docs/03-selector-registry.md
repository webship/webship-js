# Selector Registry

Long, brittle CSS strings poison feature files. Webship-js solves this with a **named selector registry**: register a CSS or XPath string once, refer to it by a friendly name in every step.

## Three ways to register

### 1. Inline (one selector at a time)

```gherkin
Scenario: Add to cart
  Given I am on "/products/101"
  When I add "buy button" selector for ".product__buy button[type=submit]" css selector
  And I click "buy button" by attr
```

### 2. Bulk (Gherkin data table)

```gherkin
Scenario: Layout assertions
  Given I define css selectors:
    | header   | header.site                |
    | nav      | nav[role="navigation"]     |
    | main     | main                       |
    | footer   | footer                     |
   Then "main" should be visible
```

### 3. JSON file (project-wide preset)

```js
// cucumber.js
worldParameters: {
  selectors: {
    filesPath: './tests/selectors/',
    files: ['cms-drupal-cms-gin.json'],
  }
}
```

Every scenario starts with a fresh registry. Later entries with the same name override earlier ones (last wins).

## Built-in CMS / framework presets

Webship-js ships ready-made selector packs:

```
tests/selectors/
├── _canonical-keys.json        # Index of canonical keys + naming rules
├── back-end-selectors.json     # Generic admin layout
├── front-end-selectors.json    # Generic public layout
├── cms-drupal-cms-gin.json     # Drupal CMS (Gin admin theme)
├── cms-drupal-core-claro.json  # Drupal Core (Claro admin theme)
├── cms-generic-admin.json      # Pattern-matching generic CMS admin
├── cms-ghost-admin.json        # Ghost
├── cms-joomla-admin.json       # Joomla
├── cms-magento2-admin.json     # Magento 2
├── cms-prestashop-admin.json   # PrestaShop
├── cms-shopify-admin.json      # Shopify Polaris admin
├── cms-strapi-admin.json       # Strapi
├── cms-typo3-admin.json        # TYPO3
├── cms-contentful-admin.json   # Contentful
├── cms-craft-admin.json        # Craft CMS
├── cms-wordpress-admin.json    # WordPress
├── cms-woocommerce-front.json  # WooCommerce storefront
├── framework-ant-design.json   # Ant Design
├── framework-bootstrap.json    # Bootstrap
├── framework-bulma.json        # Bulma
├── framework-chakra.json       # Chakra UI
├── framework-foundation.json   # Foundation
├── framework-material-ui.json  # MUI
├── framework-shadcn.json       # shadcn / Radix
├── framework-tailwind.json     # Tailwind common patterns
└── framework-vuetify.json      # Vuetify
```

## Canonical key set

To keep tests portable, every preset exposes the same core names. See `tests/selectors/_canonical-keys.json` for the full list. Highlights:

- **Layout** — `main nav`, `main nav item`, `sidebar`, `header bar`, `main content`, `page title`, `breadcrumb`, `user menu`
- **Modal** — `modal`, `modal overlay`, `modal title`, `modal body`, `modal footer`, `modal close`
- **Buttons** — `primary button`, `secondary button`, `danger button`, `save button`, `cancel button`, `delete button`
- **Notices** — `notice success`, `notice error`, `notice warning`, `notice info`, `toast`
- **Forms** — `form`, `form item`, `form label`, `form input`, `form select`, `form textarea`, `form actions`
- **Tables** — `data table`, `table header`, `table row`, `table first row`, `table row cell`
- **Tabs** — `tabs`, `tab item`, `active tab`, `tab content`
- **Search** — `search input`
- **Pagination** — `pagination`

## Naming rules

- Lowercase words separated by single spaces (`primary button`, not `primary-button`).
- Modifier first (`active tab`, `danger button`, `first list item`).
- Synonyms collapse to canonical names (`alert success` / `notification success` / `callout success` → `notice success`).
- `data table` for HTML tables; `data list` for `ul`/`ol` collections.

## Bare names and your own steps

The steps that take registered names without quotes (`When I click primary button`, `Then I see visible header, footer`, `Then I don't see promo banner`, `Then I see header above footer`, `Then I see search input has focus`) match any unquoted words after their verb, so that every registered name works, `sign in button` and `log in link` included. A custom step of your project that starts the same way with unquoted words matches them too: `When I click next button in tour` is ambiguous between your step and the bare-name click, and cucumber-js stops at it.

Write such a step with a quoted argument and words of its own around it (`When I click "Next" in the tour`), or start it with other words (`When I move to the next step of the tour`). Or register the element and use the built-in step: `When I add "tour next button" selector for ".tour .next" css selector`, then `When I click tour next button`. After adding a step, `npx cucumber-js --dry-run` lists every step that is ambiguous.
