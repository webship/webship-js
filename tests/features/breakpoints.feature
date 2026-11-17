Feature: One breakpoint registry for every step and tag
  The viewing-the-site step, the set-the-viewport step and the tags for
  mobile and desktop read the same named sizes: the built-in names, the
  project's worldParameters.selectors.breakpoints,
  WEBSHIP_SELECTORS_BREAKPOINTS and the names a scenario adds.
  tests/check-breakpoints.js covers the environment variable and the
  breakpoint marked default.

  Scenario: The viewing-the-site step knows the built-in mobile, tablet and desktop
    Given I am on "/viewport-size.html"
     When I am viewing the site on a "mobile" screen
     Then "#viewport-size" should have text "Viewport is 375 by 667"
     When I am viewing the site on a tablet device
     Then "#viewport-size" should have text "Viewport is 768 by 1024"
     When I am viewing the site on a "desktop" screen
     Then "#viewport-size" should have text "Viewport is 1200 by 900"

  Scenario: A breakpoint a scenario adds reaches the viewing-the-site step
    Given I am on "/viewport-size.html"
      And the following responsive breakpoints:
        | pocket | 320 | 480 |
     When I am viewing the site on a "pocket" screen
     Then "#viewport-size" should have text "Viewport is 320 by 480"
     When I set the viewport to the "xxl" breakpoint
     Then "#viewport-size" should have text "Viewport is 1400 by 900"
