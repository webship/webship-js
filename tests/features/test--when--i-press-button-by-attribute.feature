Feature: An example of pressing a button using its attributes.

  As a tester,
  I want to be able to press a button using its attributes.

  Scenario: Verify that you can click a button using its ID attribute.
    Given I am on "/test--when--i-press-button.html"
    When I press "btn-pressid" by "id" attr
    Then I should see "Button Pressed Successfully"

  Scenario: Verify that you can click a button using its default name attribute.
    Given I am on "/test--when--i-press-button.html"
    When I press "btn-pressname" by attr
    Then I should see "Button Pressed Successfully"
  