Feature: Meta tag steps
  As a tester,
  I want to check the meta tags in the head of a page,
  so that search engines and link previews get what the page promises.

  Scenario: A meta tag with the given attributes exists
    Given I am on "/metatags.html"
    Then the meta tag should exist with the following attributes:
      | name    | description                                                    |
      | content | A plain page with meta tags for the Webship-js meta tag steps. |
    And the meta tag should exist with the following attributes:
      | property | og:title                    |
      | content  | Meta tags - Webship Testing |
    And the meta tag should exist with the following attributes:
      | name    | robots       |
      | content | index,follow |
    And the meta tag should exist with the following attributes:
      | charset | utf-8 |

  Scenario: A meta tag with the given attributes does not exist
    Given I am on "/metatags.html"
    Then the meta tag should not exist with the following attributes:
      | name    | robots           |
      | content | noindex,nofollow |
    And the meta tag should not exist with the following attributes:
      | name    | description |
      | content | Coming soon |
    And the meta tag should not exist with the following attributes:
      | http-equiv | refresh |
    And the meta tag should not exist with the following attributes:
      | property | og:title    |
      | content  | Placeholder |

  Scenario: The content of a meta tag is plain text
    Given I am on "/metatags.html"
    Then the "description" meta tag should not contain any HTML tags
    And the "keywords" meta tag should not contain any HTML tags
    And the "og:title" meta tag should not contain any HTML tags
