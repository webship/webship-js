Feature: An example to click link by its attribute

  As a tester
  I want to be able to click link by its attribute

  Scenario: Check click link by class attribute
    Given I am on "/test--when--i-click-link.html"
     When I click "#aboutUsid" by attr
      And I wait max of 2 seconds
     Then I should see "About Us"

  Scenario: Check click link by its id attribute
    Given I am on "/test--when--i-click-link.html"
     When I click "aboutUsid" by its "id" attribute
      And I wait max of 2 seconds
     Then I should see "About Us"

  Scenario: Check click link by class attribute
    Given I am on "/test--when--i-click-link.html"
     When I click "aboutUs" by "class" attr
      And I wait max of 2 seconds
     Then I should see "About Us"