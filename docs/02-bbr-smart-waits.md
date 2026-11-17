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

…or when `budget` elapses, whichever comes first.

The probe is polled from Node (`page.evaluate` in a loop), never from a timer
inside the page. A poll that ran on the page's own `setTimeout` would be counted
in `__webshipPendingTimers` like any other timer, so the wait would see its own
next poll and never find the page quiet. `When I wait until pending timers settle`
reads the count the same way.

### How the budget is shared

Each phase is best-effort — a phase that times out is not a failure — and each
but the last gets a **share of the budget** rather than "whatever is left":

| Phase | Share of the budget |
| --- | --- |
| `<body>` attached | 25% |
| `DOMContentLoaded` | 25% |
| `networkidle` | 50% |
| AJAX + pending timers + DOM quiet | everything left |

A phase that finishes early hands its unspent time to the ones after it, and
no phase is ever given more than what is actually left. Capping `networkidle`
matters, because on a page with analytics, a chat widget or a
self-rescheduling timer it never arrives — uncapped it would eat the whole
budget and starve the AJAX / pending-timer / DOM-quiet probe, which is the
phase that decides the answer. That probe comes last, so it takes the whole
rest of the budget: after a step that changes the page (1.5 seconds), a
request or a timer of a second is still waited for.

`smartSettle` returns within `budget` even when nothing on the page ever
settles, and never hands Playwright a zero timeout (Playwright reads `0` as
"no timeout at all").

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

# Polling text assertion — re-runs the matcher until the deadline. It reads the
# page as "I should see" does: letter case ignored, hidden text included.
Then eventually I should see "Done"
Then eventually I should see "Done" within 10 seconds
```

## Auto-settle after actions

After every state-changing step, webship-js silently runs `smartSettle(page, 1500)`. Tests do not need an explicit wait between an action and its follow-up assertion in the typical case. Disable per-run with `WEBSHIP_AUTO_SETTLE=off`.

A step is state-changing when its own words — not its quoted arguments — carry one of these verbs: click, press, fill, submit, select, check, uncheck, choose, attach, upload, reload, move back / forward, go to, navigate, on the homepage, open, close, add, remove, insert, delete, save, publish, edit, update, create, enter, type, clear, reset, drag, drop, hover, tap, toggle, expand, collapse, search, send, request, flush, confirm, cancel, accept, dismiss, log in / out, sign in / out. The list covers the built-in steps and the way a project's own steps are usually worded (`When I add "Laptop" to the cart`, `When I log out`, `When I enter the 2FA code "123456"`). `Then I should see "Delete"` is no action: the verb is in the quoted text. A scroll gets no settle on purpose: it often starts a loader ("Loading more items…") that the next step checks while it shows. A project step whose words carry none of the verbs waits the same way by calling `await this.smartSettle()` itself.

## What this kills

- **Sleep-driven testing** — `wait 3s` no longer means "sleep three seconds." It means "wait up to three seconds for the page to become quiet."
- **`networkidle` blind spots** — animations and `setTimeout`-driven UI changes that did not trigger a network request still register on the DOM-mutation and timer-pending signals.
- **Race-condition flake** — a click followed by an assertion that runs before the DOM finishes updating is now caught by the auto-settle hook.

## When to override

You generally don't. A few legitimate cases:

- **Real animation** with a known duration (`wait 3 seconds` is fine — smart wait will exit early but the budget is still honored).
- **Polling backend** that mutates without fetch/XHR (e.g. raw WebSocket pushes). Use a targeted edge wait: `wait for the text "..." to appear`.
- **Off-by-design UI** that runs an `setInterval` heartbeat. The pending-timer counter only tracks `setTimeout`, so heartbeats do not block `smartSettle`.
