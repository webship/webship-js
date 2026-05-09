# BBR Smart Waits

Webship-js follows a **Behavior-Based Robotics** philosophy: **react to the environment, not the clock.** A test never sleeps for a fixed N seconds. Instead, every wait step returns as soon as the page is at the **edge** of activity — DOM ready, no in-flight network, no pending timers, no live mutations.

## What gets tracked

Webship-js installs a small init script in every browser context. It exposes four signals:

| Signal | Counter / time | Source |
| --- | --- | --- |
| Fetch / XHR in flight | `window.__webshipAjaxCount` | wraps `window.fetch` and `XMLHttpRequest.send` |
| Pending `setTimeout` | `window.__webshipPendingTimers` | wraps `window.setTimeout` / `clearTimeout` |
| Last DOM mutation | `window.__webshipLastMutation` | `MutationObserver` on `<html>` |
| Network idle | (Playwright internal) | `page.waitForLoadState('networkidle')` |

`smartSettle(page, budget)` polls all four atomically and returns when:

```
__webshipAjaxCount === 0
  && __webshipPendingTimers === 0
  && (Date.now() - __webshipLastMutation) >= 250 ms
```

…or when `budget` elapses, whichever comes first. Each phase is best-effort, so a slow network does not stall the others.

## Step phrasings

```gherkin
# Bounded smart wait (returns early on idle).
When I wait 5 seconds
When I wait max of 5 seconds
When I wait for 3 seconds for AJAX to finish

# Pure edge waits.
When I wait until the page is loaded
When I wait for AJAX to finish
When I wait until pending timers settle
When I wait until the network is idle

# Targeted edge waits.
When I wait for "#dashboard" to appear
When I wait for "#loading" to disappear
When I wait for the text "Welcome" to appear
When I wait until the URL contains "/dashboard"
When I wait until the page title contains "Dashboard"
When I wait until 5 elements match ".product-card"
When I wait until at least 3 elements match ".item"

# Modal-specific.
When I wait for the modal to appear
When I wait for the modal to disappear

# Body + DOMContentLoaded only (cheaper than full smart settle).
When I wait until the page is interactive

# Polling text assertion — re-runs the matcher until the deadline.
Then eventually I should see "Done"
Then eventually I should see "Done" within 10 seconds
```

## Auto-settle after actions

After every state-changing step (click, press, fill, submit, select, check, uncheck, choose, attach, reload, navigate), webship-js silently runs `smartSettle(page, 1500)`. Tests do not need an explicit wait between an action and its follow-up assertion in the typical case. Disable per-run with `WEBSHIP_AUTO_SETTLE=off`.

## What this kills

- **Sleep-driven testing** — `wait 3s` no longer means "sleep three seconds." It means "wait up to three seconds for the page to become quiet."
- **`networkidle` blind spots** — animations and `setTimeout`-driven UI changes that did not trigger a network request still register on the DOM-mutation and timer-pending signals.
- **Race-condition flake** — a click followed by an assertion that runs before the DOM finishes updating is now caught by the auto-settle hook.

## When to override

You generally don't. A few legitimate cases:

- **Real animation** with a known duration (`wait 3 seconds` is fine — smart wait will exit early but the budget is still honored).
- **Polling backend** that mutates without fetch/XHR (e.g. raw WebSocket pushes). Use a targeted edge wait: `wait for the text "..." to appear`.
- **Off-by-design UI** that runs an `setInterval` heartbeat. The pending-timer counter only tracks `setTimeout`, so heartbeats do not block `smartSettle`.
