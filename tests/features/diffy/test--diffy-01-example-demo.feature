Feature: Diffy — example pages demo
  Drive the bundled /diffy/baseline.html and /diffy/changed.html example
  pages through the Diffy capture + comparison flow. Safe to run against
  the mock Diffy API for local development.

  Config resolution (per-scenario):
    1. process.env.DIFFY_*
    2. cucumber.js worldParameters.diffy.*
    3. built-in defaults

  @diffy @example
  Scenario: Capture baseline and changed, send to diffy, compare
    Given I am on "/diffy/baseline.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "example-baseline"

    Given I am on "/diffy/changed.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "example-changed"

    Then create diffy comparison with name "example-demo"
    Then wait for diffy comparison to complete
