@video
Feature: 🎬 Video recording

  As a tester, I want to record a short browser video so that I can attach it
  to a bug report and let reviewers replay what happened.

  Scenario: 🎥 Record a tiny click flow with emojis
    When I start video recording
    Given I am on "/video-demo.html"
    Then I should see "Webship-js Video Demo"
    When I press "👋 Wave"
    Then I should see "Hello, world"
    When I press "🚀 Launch"
    Then I should see "Liftoff!"
    When I press "🎉 Celebrate"
    Then I should see "Party time"
    When I save the current video as "demo.webm"
    When I stop video recording
