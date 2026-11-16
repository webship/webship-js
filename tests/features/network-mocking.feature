Feature: Network mocking, blocking, delaying, offline mode and request assertions
  As a tester,
  I want to decide what a URL answers, to block it, to slow it down and to cut the network,
  so that I can check what the page shows in each case and which requests it sent.

  Scenario: Without mocking the page shows what the site answers
    Given I am on "/network.html"
    When I press "Load article"
    Then "#article-status" should have text "Article loaded" within 10 seconds
    And "#article-title" should have text "JSON:API paints my bikeshed!"
    And "#article-author" should have text "Written by John"
    And "#article-timing" should have text "Answered in under 2 seconds"

  Scenario: A URL answers with the JSON of the scenario
    Given the URL "**/example-api.json" returns the JSON:
      """
      {
        "data": [{"attributes": {"title": "A mocked article"}}],
        "included": [{"attributes": {"name": "Webship"}}]
      }
      """
    And I am on "/network.html"
    When I press "Load article"
    Then "#article-status" should have text "Article loaded" within 10 seconds
    And "#article-title" should have text "A mocked article"
    And "#article-author" should have text "Written by Webship"
    And I should not see "JSON:API paints my bikeshed!"

  @js-off
  Scenario: A blocked URL fails in the page
    Given I am on "/network.html"
    And the URL "**/example-api.json" is blocked
    When I press "Load article"
    Then "#article-status" should have text "The article request failed" within 10 seconds
    And "#article-title" should have text ""

  Scenario: A delayed URL answers late, with the answer of the site
    Given I am on "/network.html"
    And the URL "**/example-api.json" is delayed by 2500 ms
    When I press "Load article"
    Then "#article-status" should have text "Article loaded" within 15 seconds
    And "#article-timing" should have text "Answered after 2 seconds or more"
    And "#article-title" should have text "JSON:API paints my bikeshed!"

  Scenario: The delay is also written without a space before ms
    Given I am on "/network.html"
    And the URL "**/example-api.json" is delayed by 2500ms
    When I press "Load article"
    Then "#article-status" should have text "Article loaded" within 15 seconds
    And "#article-timing" should have text "Answered after 2 seconds or more"

  @js-off
  Scenario: Requests fail while the network is offline and work again once it is online
    Given I am on "/network.html"
    Then "#connection" should have text "The browser is online"
    When the network is offline
    And I press "Load article"
    Then "#article-status" should have text "The article request failed" within 10 seconds
    And "#connection" should have text "The browser is offline"
    When the network is online
    And I press "Load article"
    Then "#article-status" should have text "Article loaded" within 10 seconds
    And "#article-title" should have text "JSON:API paints my bikeshed!"
    And "#connection" should have text "The browser is online"

  Scenario: The requests the page sent are recorded with their method
    Given I am on "/network.html"
    And the URL "**/api/feedback" returns the JSON:
      """
      {"message": "Thank you from Webship"}
      """
    And I start recording network requests
    When I press "Load article"
    Then "#article-status" should have text "Article loaded" within 10 seconds
    When I press "Send feedback"
    Then "#feedback-status" should have text "Feedback answer: Thank you from Webship" within 10 seconds
    And a GET request to "**/example-api.json" should have been made
    And a POST request to "**/api/feedback" should have been made
    And a request to "**/api/feedback" should have been made
    And no request to "**/api/tracking" should have been made
