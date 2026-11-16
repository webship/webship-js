Feature: Mouse and pointer step definitions
  As a tester,
  I want to hover, double-click, right-click, middle-click, click with a key held,
  drag, tap and resize the viewport,
  so that pages reacting to the pointer can be tested.

  Scenario: Hover over an element
    Given I am on "/mouse-and-pointer.html"
     Then "#result" should have text "Nothing happened yet"
     When I hover over "#hover-card"
     Then "#result" should have text "Hovered over the hover card"

  Scenario: Move the pointer to an element
    Given I am on "/mouse-and-pointer.html"
     When I move the pointer to "#pointer-card"
     Then "#result" should have text "Pointer moved to the pointer card"

  Scenario: Move the pointer from one element to another
    Given I am on "/mouse-and-pointer.html"
     When I hover over "#hover-card"
      And I move the pointer to "#pointer-card"
     Then "#result" should have text "Pointer moved to the pointer card"

  Scenario: Double-click on an element
    Given I am on "/mouse-and-pointer.html"
     When I double-click on "#double-click-card"
     Then "#result" should have text "Double-clicked the card"

  Scenario: Double click on an element, written without the hyphen
    Given I am on "/mouse-and-pointer.html"
     When I double click on "#double-click-card"
     Then "#result" should have text "Double-clicked the card"

  Scenario: Right-click on an element
    Given I am on "/mouse-and-pointer.html"
     When I right-click on "#right-click-card"
     Then "#result" should have text "Right-clicked the card"

  Scenario: Right click on an element, written without the hyphen
    Given I am on "/mouse-and-pointer.html"
     When I right click on "#right-click-card"
     Then "#result" should have text "Right-clicked the card"

  Scenario: Middle-click on an element
    Given I am on "/mouse-and-pointer.html"
     When I middle-click on "#middle-click-card"
     Then "#result" should have text "Middle-clicked the card"

  Scenario: Middle click on an element, written without the hyphen
    Given I am on "/mouse-and-pointer.html"
     When I middle click on "#middle-click-card"
     Then "#result" should have text "Middle-clicked the card"

  Scenario: Click on an element while holding Shift
    Given I am on "/mouse-and-pointer.html"
     When I click on "#modifier-card" while holding "Shift"
     Then "#result" should have text "Clicked while holding Shift"

  Scenario: Click on an element while holding Control
    Given I am on "/mouse-and-pointer.html"
     When I click on "#modifier-card" while holding "Control"
     Then "#result" should have text "Clicked while holding Control"

  Scenario: Click on an element while holding Alt
    Given I am on "/mouse-and-pointer.html"
     When I click on "#modifier-card" while holding "Alt"
     Then "#result" should have text "Clicked while holding Alt"

  Scenario: Drag an element to another element
    Given I am on "/mouse-and-pointer.html"
     Then "#result" should have text "Nothing happened yet"
     When I drag "#drag-card" to "#drop-zone"
     Then "#result" should have text "Dropped the drag card in the drop zone"
      And I should see "Drag card" in the "#drop-zone" element

  Scenario: Tap on an element
    Given I am on "/mouse-and-pointer.html"
     When I tap on "#tap-card"
     Then "#result" should have text "Tapped the card"

  Scenario: Set the viewport size
    Given I am on "/viewport-size.html"
     When I set the viewport size to 375x667
     Then "#viewport-size" should have text "Viewport is 375 by 667"
     When I set the viewport size to 1280x720
     Then "#viewport-size" should have text "Viewport is 1280 by 720"
