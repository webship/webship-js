Feature: Diffy — all step definitions smoke test
  Exercise every Diffy step at least once against the example pages.
  Intended for mock-Diffy runs (some steps require specific Diffy plan
  features and may fail against production with a valid key).

  @diffy @smoke
  Scenario: Resize, take screenshot, breakpoints loop, send
    Given I am on "/diffy/baseline.html"
    When I resize window to "640"
    Then I take screenshot
    Given I am on "/diffy/changed.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "smoke-set-1"

    Given I am on "/diffy/baseline.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "smoke-set-2"

    Then create diffy comparison
    Then wait for diffy comparison to complete

  @diffy @smoke @named-compare
  Scenario: Named comparison variant
    Given I am on "/diffy/baseline.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "smoke-named-a"

    Given I am on "/diffy/changed.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "smoke-named-b"

    Then create diffy comparison with name "PR-smoke"
    Then wait for diffy comparison to complete

  @diffy @smoke @env-compare
  Scenario: Server-side environment compare
    Then compare diffy "prod" with "stage"
    Then wait for diffy comparison to complete

  @diffy @smoke @env-screenshot
  Scenario: Trigger Diffy-side screenshot run per environment
    Then create diffy screenshot from "production" environment
    Then create diffy screenshot from "staging" environment
    Then create diffy comparison with name "env-pair"
    Then wait for diffy comparison to complete

  @diffy @smoke @folder-upload
  Scenario: Upload PNG folders to Diffy
    Then upload folder "/tmp/diffy-test-screenshots/baseline" to diffy as "folder-baseline"
    Then upload folder "/tmp/diffy-test-screenshots/feature" to diffy as "folder-feature"
    Then create diffy comparison with name "folder-pair"
    Then wait for diffy comparison to complete
