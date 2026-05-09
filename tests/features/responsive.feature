Feature: Responsive step definitions

  Scenario: Set viewport via breakpoints
    Given I am on the homepage
     When I set the viewport to the "mobile" breakpoint
      And I set the viewport to the "tablet" breakpoint
      And I set the viewport to the "desktop" breakpoint
      And I set the viewport width to 800
      And I set the viewport height to 600
      And I set the viewport to 1024 by 768
