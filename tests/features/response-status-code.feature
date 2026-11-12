Feature: The response status code is the one the browser received
  As a tester,
  I want the response status and header steps to read the response of the page the browser is showing
  So that they follow the browser session: its cookies, its HTTPS settings, redirects and stubbed pages

  Scenario: Status after a direct visit
    Given I am on "/existing-page.html"
     Then the response status code should be 200
      And the response status code should not be 404
      And the response status code should not be 500

  Scenario: Status of a missing page
    Given I am on "/not-existing-page.html"
     Then the response status code should be 404
      And the response status code should not be 200

  Scenario: Status after a redirect is the status of the page the redirect ends on
    Given I am on "/response-status"
     Then the path should be "/response-status/"
      And I should see "Redirected section"
      And the response status code should be 200
      And the response status code should not be 302

  Scenario: Status after clicking a link to an existing page
    Given I am on "/response-status.html"
     When I click "Open the existing page"
     Then I should see "An example page that returns a 200 response code"
      And the response status code should be 200

  Scenario: Status after clicking a link to a missing page
    Given I am on "/response-status.html"
     Then the response status code should be 200
     When I click "Open the missing page"
     Then the path should be "/not-existing-page.html"
      And the response status code should be 404
      And the response status code should not be 200

  Scenario: Status after clicking a link that redirects
    Given I am on "/response-status.html"
     When I click "Open the redirected section"
     Then I should see "Redirected section"
      And the response status code should be 200

  Scenario: Status stays the same after a jump inside the page
    Given I am on "/response-status.html"
     When I click "Jump to the details"
     Then the response status code should be 200
      And the response status code should not be 404

  Scenario: Status of a page that answers 403
    Given I am on the homepage
      And the URL "**/restricted.html" returns status 403 with body "Access denied"
     When I go to "/restricted.html"
     Then the response status code should be 403
      And the response status code should not be 200

  Scenario: Status of a page that answers 500
    Given I am on the homepage
      And the URL "**/broken.html" returns status 500 with body "Server error"
     When I go to "/broken.html"
     Then the response status code should be 500
      And the response status code should not be 200

  Scenario: Status follows the page after a visit to a missing page and a new visit
    Given I am on "/not-existing-page.html"
     Then the response status code should be 404
     When I go to "/existing-page.html"
     Then the response status code should be 200
      And the response status code should not be 404

  Scenario: Status after reloading the page
    Given I am on "/existing-page.html"
     When I reload the page
     Then the response status code should be 200

  Scenario: Status after moving back in the history
    Given I am on "/existing-page.html"
     When I go to "/not-existing-page.html"
     Then the response status code should be 404
     When I move backward one page
     Then the path should be "/existing-page.html"
      And the response status code should be 200
     When I move forward one page
     Then the response status code should be 404

  Scenario: Status in a new anonymous session
    Given I am an anonymous user
     When I go to "/existing-page.html"
     Then the response status code should be 200
     When I go to "/not-existing-page.html"
     Then the response status code should be 404

  Scenario: Headers are read from the same response as the status
    Given I am on "/existing-page.html"
     Then the response should contain the header "content-type"
      And the response header "content-type" should contain the value "html"
     When I go to "/example-api.json"
     Then the response status code should be 200
      And the response header "content-type" should contain the value "application/json"
      And the response header "content-type" should not contain the value "html"

  Scenario: Status on a page opened after the browser session was replaced
    Given the basic authentication with the username "tester" and the password "secret"
     When I go to "/existing-page.html"
     Then the response status code should be 200
      And the response should contain the header "content-type"
     When I go to "/not-existing-page.html"
     Then the response status code should be 404
