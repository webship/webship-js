
# Advanced Selectors

## Overview

This documentation page describes a unified selector system for Webship-JS 2.0.x that consolidates CSS selectors, XPath selectors, layout components, viewport breakpoints, and relative-position assertions into a single module.

## Key Features

The advanced selectors system unifies multiple selector types through these capabilities:

- **Unified Resolution**: Combines CSS and XPath selectors with consistent priority ordering where "css → xpath" applies, with latest registration overriding previous entries for identical names.

- **Auto-Retrying Assertions**: Replaces manual visibility checks with "Playwright's auto-retrying wait states" rather than legacy DOM inspection methods.

- **Accessibility-First Locators**: Leverages Playwright semantic helpers like `getByLabel`, `getByPlaceholder`, and `getByRole()` chained via `.or()` to match user interaction patterns.

- **Standardized Breakpoints**: Implements xs/sm/md/lg/xl/xxl/xxxl viewport scales aligned with Bootstrap 5.3 conventions.
