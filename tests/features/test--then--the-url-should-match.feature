Feature: An example of testing for matching URLs for a particular expression
As a tester
I want to be able to be sure that current page PATH matches regular expression

  Scenario: Check the current page path matchs URL expression with dashes between words
    Given I am on "/test-acceptable-url-path.html"
    Then the url should match "(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:\d+)?(\/[^?#\s_]+)?(\?[^#\s_]+)?(#.*)?"