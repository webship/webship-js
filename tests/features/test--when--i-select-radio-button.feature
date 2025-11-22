Feature: An example of selecting radio buttons
  As a tester,
  I want to be able to select radio button options

  Scenario: Implementing the ability to select radio buttons
    Given I am on "/test--when--i-select-radio-button.html"
     When I select radio button "Male"
      And I press "Submit" by "value" attr
     Then I should see "Selected: Male"
      And the radio button "#gender-male" should be selected
      And the radio button "#gender-female" should not be selected
     When I select radio button "Female"
      And I press "Submit" by "value" attr
     Then I should see "Selected: Female"
      And the "#gender-female" radio button is selected
      And the "#gender-male" radio button is not selected

  Scenario: Selecting radio buttons by value
    Given I am on "/test--when--i-select-radio-button.html"
     When I select radio button "red"
     Then the radio button with value "red" should be selected
      And the radio button with value "blue" should not be selected
     When I select radio button "blue"
     Then the radio button with value "blue" should be selected
      And the radio button with value "red" should not be selected

  Scenario: Selecting radio buttons by selector
    Given I am on "/test--when--i-select-radio-button.html"
     When I select radio button "#plan-basic"
      And I press "Plan Submit" by "value" attr
     Then I should see "Plan: Basic"
      And the "#plan-basic" radio button is selected
     When I select radio button "#plan-premium"
      And I press "Plan Submit" by "value" attr
     Then I should see "Plan: Premium"
      And the "#plan-premium" radio button is selected
      And the "#plan-basic" radio button is not selected
