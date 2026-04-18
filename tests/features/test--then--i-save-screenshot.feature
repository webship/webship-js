Feature: Save screenshots to disk.
  As a tester,
  I want to capture screenshots at arbitrary points in my scenarios
  so that I can review rendered pages and debug failures.

  Background:
    Given I am on homepage

  Scenario: Save a screenshot at the current viewport size.
    Then I save screenshot

  Scenario: Save a full-page screenshot.
    Then I save fullscreen screenshot

  Scenario: Save a screenshot after resizing the viewport.
    Then I save 1440 x 900 screenshot

  Scenario: Save a full-page screenshot at a fixed viewport.
    Then I save fullscreen 1200 x 800 screenshot

  Scenario: Save a screenshot with an explicit filename.
    Then I save screenshot with name "webship-home.png"

  Scenario: Save a full-page screenshot with an explicit filename.
    Then I save fullscreen screenshot with name "webship-home-full.png"

  Scenario: Save a screenshot with filename tokens.
    Then I save screenshot with name "{feature_file}_{step_line}_{datetime}.png"

  @screenshots
  Scenario: Auto-capture a screenshot after every step in a tagged scenario.
    Given I am on "/about-us.html"
     Then I should see "About Us"
