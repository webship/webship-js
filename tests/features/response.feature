Feature: Response step definitions

  Scenario: Inspect response headers from main navigation
    Given I am on the homepage
     Then the response should contain the header "content-type"
      And the response header "content-type" should contain the value "html"
      And the response should not contain the header "x-fake-header"
      And the response header "content-type" should not contain the value "application/json"
