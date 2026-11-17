Feature: Taps in a browser context with touch
  A scenario tagged @touch opens with touch on, so "I tap on" fires the
  touch events a mobile control listens to. Without the tag the browser
  context has no touch, and a tap is a click.

  @touch
  Scenario: A tap with touch on reaches a control that listens to touch only
    Given I am on "/touch.html"
     When I tap on "#touch-card"
     Then "#result" should have text "Touched the card"

  @mobile @touch
  Scenario: A phone with touch
    Given I am on "/touch.html"
     When I tap on "#touch-card"
     Then "#result" should have text "Touched the card"

  Scenario: Without touch a tap is a click
    Given I am on "/touch.html"
     When I tap on "#click-card"
     Then "#result" should have text "Clicked the card"
