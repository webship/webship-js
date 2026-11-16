Feature: Responsive step definitions

  Scenario: Set viewport via breakpoints
    Given I am on the homepage
     When I set the viewport to the "mobile" breakpoint
      And I set the viewport to the "tablet" breakpoint
      And I set the viewport to the "desktop" breakpoint
      And I set the viewport width to 800
      And I set the viewport height to 600
      And I set the viewport to 1024 by 768

  Scenario: Define responsive breakpoints for the scenario
    Given I am on "/viewport-size.html"
      And the following responsive breakpoints:
        | pocket | 320 | 480  |
        | mobile | 400 | 700  |
        | poster | 900 | 1200 |
     When I set the viewport to the "pocket" breakpoint
     Then "#viewport-size" should have text "Viewport is 320 by 480"
     When I set the viewport to the "poster" breakpoint
     Then "#viewport-size" should have text "Viewport is 900 by 1200"
     When I set the viewport to the "mobile" breakpoint
     Then "#viewport-size" should have text "Viewport is 400 by 700"
     When I set the viewport to the "tablet" breakpoint
     Then "#viewport-size" should have text "Viewport is 768 by 1024"
