Feature: Steps that take a URL accept a path or an absolute URL
  As a tester,
  I want a step given "/page" to open it under the launch URL,
  and a step given "http://host/page" to open that URL as written,
  so that a scenario can leave the site under test and come back.

  Scenario: A path is joined to the launch URL
    Given I am on "/about-us.html"
    Then the path should be "/about-us.html"
    And I should see "About Us"

  Scenario: An absolute URL is opened as written
    Given I am on "http://localhost:8080/contact-us.html"
    Then the path should be "/contact-us.html"
    And I should see "Contact Us"

  Scenario: An absolute URL is opened as written, with the page phrasing
    Given I am on the "http://localhost:8080/path.html?lang=en" page
    Then the path should be "/path.html"
    And current url should have the "lang" parameter with the "en" value

  Scenario: Go to a path, then to an absolute URL
    Given I am on the homepage
    When I go to "/about-us.html"
    Then the path should be "/about-us.html"
    When I navigate to "http://localhost:8080/contact-us.html"
    Then the path should be "/contact-us.html"
    And I should see "Contact Us"

  Scenario: Go to an absolute URL with the other phrasings
    Given I am on the homepage
    When we go to "http://localhost:8080/path.html"
    Then the path should be "/path.html"
    When navigating to "http://localhost:8080/element.html"
    Then the path should be "/element.html"

  Scenario: An absolute URL is case-insensitive in its scheme
    Given I am on "HTTP://localhost:8080/path.html"
    Then the path should be "/path.html"

  Scenario: A REST request takes a path or an absolute URL
    When I send a REST "GET" request to "/example-api.json"
    Then the REST response status code should be 200
    When I send a REST "GET" request to "http://localhost:8080/example-api.json"
    Then the REST response status code should be 200

  Scenario: A download takes a path or an absolute URL
    When I download the file from the URL "/example-api.json"
    Then the downloaded file name should be "example-api.json"
    When I download the file from the URL "http://localhost:8080/example-api.json"
    Then the downloaded file name should be "example-api.json"
