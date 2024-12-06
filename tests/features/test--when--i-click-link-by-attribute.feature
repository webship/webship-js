Feature: An example of clicking a link by its attribute

  As a tester, 
  I want to be able to click a link by its attribute

  Scenario: Verify the action of clicking a link by targeting its ID attribute
    Given I am on "/test--when--i-click-link.html"
     When I click "#aboutUsid" by attr
      And I wait max of 2 seconds
     Then I should see "About Us"

  Scenario: Verify the action of clicking a link by its ID attribute
    Given I am on "/test--when--i-click-link.html"
     When I click "aboutUsid" by its "id" attribute
      And I wait max of 2 seconds
     Then I should see "About Us"

  Scenario: Verify the action of clicking a link by its class attribute
    Given I am on "/test--when--i-click-link.html"
     When I click "aboutUs" by "class" attr
      And I wait max of 2 seconds
     Then I should see "About Us"