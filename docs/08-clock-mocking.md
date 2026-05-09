# Clock Mocking

Time-dependent UI is hard to test in real time: a "5 minutes ago" label takes 5 minutes to verify, a session-timeout warning sits idle for 14 minutes before firing. Webship-js wraps Playwright's `page.clock` API in BDD steps so scenarios can advance virtual time at full speed.

## Install a fake clock

```gherkin
Given the system time is "2026-05-08T10:00:00Z"
```

After this step, `Date.now()` inside the page returns the fake time. Pending `setTimeout` and `setInterval` callbacks queue but do not fire until you advance the clock.

## Advance time

```gherkin
When I advance the clock by 500 ms
When I advance the clock by 30 seconds
When I advance the clock by 15 minutes
```

Each advance fires every timer scheduled within the new interval, in order, in real-time speed (i.e. instantly).

## Pause / resume / set

```gherkin
When I pause the clock
When I resume the clock
When I set the system time to "2026-12-31T23:59:55Z"
```

`pause` freezes time at the current value. `set` jumps to a new instant **without** firing the timers in between (use `advance` if you want them to fire).

## Recipe: relative-time labels

```gherkin
Scenario: "5 minutes ago" updates as time passes
  Given the system time is "2026-05-08T10:00:00Z"
   And I am on "/feed"
   And "<.timestamp>" should have text "just now"
  When I advance the clock by 5 minutes
  Then "<.timestamp>" should have text "5 minutes ago"
```

## Recipe: session timeout

```gherkin
Scenario: Idle warning fires at 14 minutes
  Given the system time is "2026-05-08T10:00:00Z"
   And I restore the auth state from "tests/auth/admin.json"
   And I am on "/dashboard"
  When I advance the clock by 14 minutes
  Then "<#session-warning>" should be visible
```

## Caveats

- `requestAnimationFrame` and `MutationObserver` are not on the fake clock. Animations driven by `rAF` keep playing in real time.
- The Date constructor reads the fake clock, but server timestamps embedded at page load do not change.
- Install the clock **before** loading the page if you need scripts to see the fake time on first execution.
