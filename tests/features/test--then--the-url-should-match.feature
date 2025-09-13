Feature: An example of checking for matching URLs based on a specific pattern
  As a tester,
  I want to ensure that the current page path matches a specific pattern

  Scenario: Ensure that the current page path matches the URL pattern that uses dashes between words
    Given I am on "/test-acceptable-url-path.html"
     Then the url should match "(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:\d+)?(\/[^?#\s_]+)?(\?[^#\s_]+)?(#.*)?"