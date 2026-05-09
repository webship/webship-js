Feature: Keyboard step definitions

  Scenario: Keyboard input
    Given I am on "/keyboard.html"
     When I focus on the element "#inp"
      And I press the key "Enter"
     Then I should see "Enter"
     When I press the key "tab" on the element "#inp"
      And I press the keys "Control+a"
      And I press the keys "Control+a" on the element "#inp"
