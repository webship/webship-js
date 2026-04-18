Feature: Diffy — real API smoke
  Run the minimum set against the production Diffy API. Requires valid
  DIFFY_API_KEY and DIFFY_PROJECT_ID for a project whose allowed URLs
  match LAUNCH_URL (e.g. http://localhost:8080 via ngrok, or a hosted
  copy of /examples).

  Do NOT run without a live key. Scoped behind @real-api so mock runs
  skip it automatically (cucumber-js --tags "not @real-api").

  @diffy @real-api
  Scenario: Real API baseline + changed comparison
    Given I am on "/diffy/baseline.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "real-baseline"

    Given I am on "/diffy/changed.html"
    Then I take screenshots for all breakpoints
    Then send screenshots to diffy with name "real-changed"

    Then create diffy comparison with name "real-api-demo"
    Then wait for diffy comparison to complete
