Feature: Relative element positioning assertions and advanced selector system.
  As a tester,
  I want to assert that page components are positioned correctly relative to each other
  and resolve elements via a named CSS/XPath selector registry
  so that I can catch layout regressions without brittle pixel comparisons.

  Background:
    Given I am on homepage
    And I define css selectors:
      | heading  | h1              |
      | subline  | h3              |
      | list     | ul              |

  # ---------------------------------------------------------------------------
  # Breakpoints — cover all 7 configured sizes (pronoun variants too).
  # ---------------------------------------------------------------------------
  Scenario: Resize to xs breakpoint.
    Given I am viewing the site on a xs screen
    Then I see visible heading

  Scenario: Resize to sm breakpoint.
    Given I am viewing the site on a sm screen
    Then I see visible heading

  Scenario: Resize to md breakpoint.
    Given I am viewing the site on a md device
    Then I see visible heading

  Scenario: Resize to lg breakpoint.
    Given I am viewing the site on a lg screen
    Then I see visible heading

  Scenario: Resize to xl breakpoint (default).
    Given I am viewing the site on a xl screen
    Then I see visible heading

  Scenario: Resize to xxl breakpoint.
    Given I am viewing the site on a xxl screen
    Then I see visible heading

  Scenario: Resize to xxxl breakpoint using quoted name.
    Given I am viewing the site on a "xxxl" screen
    Then I see visible heading

  Scenario: Resize using the "we are" pronoun variant.
    Given we are viewing the site on a md screen
    Then we see visible heading

  Scenario: Resize using no pronoun at all.
    Given viewing the site on a lg screen
    Then I see visible heading

  # ---------------------------------------------------------------------------
  # Position assertions — above / below / left / right / inside / outside.
  # ---------------------------------------------------------------------------
  Scenario: Assert heading is above list.
    Then I see heading above list

  Scenario: Assert heading is above multiple targets.
    Then I see heading above subline, list

  Scenario: Assert list is below heading.
    Then I see list below heading

  Scenario: Assert chained above relations.
    Then I see heading above subline
    Then I see subline above list

  Scenario: Assert heading is inside of body component.
    Given I define css selectors:
      | body | body |
    Then I see heading inside of body

  Scenario: Assert body outside of heading.
    Given I define css selectors:
      | body | body |
    Then I see body outside of heading

  Scenario: Pronoun variants on position assertions.
    Then we see heading above list
    Then see heading above list

  # ---------------------------------------------------------------------------
  # Visibility + hidden.
  # ---------------------------------------------------------------------------
  Scenario: Assert single component visible.
    Then I see visible heading

  Scenario: Assert multiple components visible.
    Then I see visible heading, subline and list

  Scenario: Assert hidden (don't see) with missing components.
    Given I define css selectors:
      | missing | #does-not-exist |
    Then I don't see missing

  Scenario: Pronoun variants on visibility.
    Then we see visible heading
    Then see visible heading

  # ---------------------------------------------------------------------------
  # Advanced selector registry — CSS + XPath.
  # ---------------------------------------------------------------------------
  Scenario: Register a named CSS selector at runtime.
    When I add "page heading" selector for "h1" css selector
    Then I see visible page heading

  Scenario: Register a named XPath selector at runtime.
    When I add "first heading" selector for "//h1[1]" xpath selector
    Then I see visible first heading

  Scenario: Register multiple selectors and use mix of components, css, xpath.
    When I add "page heading" selector for "h1" css selector
    And I add "third level" selector for "//h3[1]" xpath selector
    Then I see visible page heading
    And I see visible third level
    And I see page heading above list

  Scenario: Print registered CSS selectors.
    When I add "page heading" selector for "h1" css selector
    Then I print css selectors

  Scenario: Print registered XPath selectors.
    When I add "first heading" selector for "//h1[1]" xpath selector
    Then I print xpath selectors

  Scenario: Pronoun variants on selector registration.
    When we add "nav item" selector for "nav a" css selector
    And add "first para" selector for "//p[1]" xpath selector
    Then we print css selectors
    And we print xpath selectors

  Scenario: Bulk define CSS selectors via data table.
    Given I define css selectors:
      | bulk heading | h1 |
      | bulk subline | h3 |
      | bulk list    | ul |
    Then I see visible bulk heading, bulk subline, bulk list
    And I see bulk heading above bulk list

  Scenario: Bulk define XPath selectors via data table.
    Given I define xpath selectors:
      | xp heading | //h1[1] |
      | xp subline | //h3[1] |
      | xp list    | //ul[1] |
    Then I see visible xp heading, xp subline, xp list
    And I see xp heading above xp list

  Scenario: Mix bulk CSS + bulk XPath in one scenario.
    Given I define css selectors:
      | mixed heading | h1 |
    And I define xpath selectors:
      | mixed first list | //ul[1] |
    Then I see mixed heading above mixed first list

  # ---------------------------------------------------------------------------
  # Focus and text selection on input fields.
  # ---------------------------------------------------------------------------
  Scenario: Move focus to a field and assert focus.
    Given I am on "/test--when--i-fill-in.html"
    And I add "username" selector for "[name='username']" css selector
    When I move focus to "username" field
    Then I see username has focus

  Scenario: Select all text in a field.
    Given I am on "/test--when--i-fill-in.html"
    And I add "username" selector for "[name='username']" css selector
    And I fill in "username" with "webship-tester"
    When I select all text in "username" field
    Then I see username has focus

  Scenario: Select a character range in a field.
    Given I am on "/test--when--i-fill-in.html"
    And I fill in "username" with "webship-tester"
    When I select from 0 to 7 text in "username" field

  Scenario: Select a substring inside a field.
    Given I am on "/test--when--i-fill-in.html"
    And I fill in "username" with "webship-tester"
    When I select "tester" text in "username" field

  Scenario: Pronoun variants on focus + selection.
    Given I am on "/test--when--i-fill-in.html"
    And I fill in "username" with "webship-tester"
    When we move focus to "username" field
    And we select all text in "username" field

  # ---------------------------------------------------------------------------
  # Click by named component.
  # ---------------------------------------------------------------------------
  Scenario: Click a registered component.
    Given I define css selectors:
      | first heading | h1 |
    When I click first heading

  Scenario: Click using "on" phrasing.
    Given I define css selectors:
      | first heading | h1 |
    When I click on first heading

  Scenario: Click pronoun variants.
    Given I define css selectors:
      | first heading | h1 |
    When we click first heading
    And click on first heading

  # ---------------------------------------------------------------------------
  # Advanced — selector file loading (JSON).
  # ---------------------------------------------------------------------------
  Scenario: Load selectors from a single JSON file.
    When I add selectors from "homepage-selectors.json" file
    Then I see visible homepage heading
    And I see visible homepage first heading
    And I print css selectors
    And I print xpath selectors

  Scenario: Load selectors from two JSON files (front-end + back-end).
    When I add selectors from "front-end-selectors.json" file
    And I add selectors from "back-end-selectors.json" file
    Then I see visible page heading, admin heading
    And I see visible first heading, admin first heading

  Scenario: Loaded file selectors mix with components and inline registrations.
    When I add selectors from "homepage-selectors.json" file
    And I add "inline heading" selector for "h1" css selector
    And I add "inline first heading" selector for "//h1[1]" xpath selector
    Then I see visible homepage heading
    And I see visible inline heading
    And I see visible inline first heading
    And I see heading above list
    And I see homepage heading above list

  # ---------------------------------------------------------------------------
  # Advanced — resolver priority (components → css → xpath) with overrides.
  # ---------------------------------------------------------------------------
  Scenario: Component overrides a CSS registration of the same name.
    When I add "shared" selector for "ul" css selector
    And I define css selectors:
      | shared | h1 |
    Then I see visible shared
    And I see shared above list

  Scenario: CSS registration overrides a prior CSS registration of same name.
    When I add "dynamic" selector for "h1" css selector
    And I add "dynamic" selector for "ul" css selector
    Then I see visible dynamic
    And I see heading above dynamic

  Scenario: XPath-only registration resolves via xpath= prefix.
    When I add "first subline xp" selector for "//h3[1]" xpath selector
    Then I see visible first subline xp

  # ---------------------------------------------------------------------------
  # Advanced — multi-subject, multi-target position dispatch.
  # ---------------------------------------------------------------------------
  Scenario: Multiple subjects, single target (above).
    Then I see heading, subline above list

  Scenario: Single subject, multiple targets with "and" + comma.
    Then I see heading above subline, list

  Scenario: Chain of position assertions covers layout order.
    Then I see heading above subline, list
    And I see subline above list
    And I see list below subline, heading

  # ---------------------------------------------------------------------------
  # Advanced — inside / outside containment.
  # ---------------------------------------------------------------------------
  Scenario: Heading and list both inside body.
    Given I define css selectors:
      | body | body |
    Then I see heading, list inside of body
    And I see body outside of heading, list

  # ---------------------------------------------------------------------------
  # Advanced — "not over" negation (non-overlap).
  # ---------------------------------------------------------------------------
  Scenario: Block-level neighbours do not overlap.
    Then I see heading not over list

  # ---------------------------------------------------------------------------
  # Advanced — breakpoint resize then layout reassert.
  # ---------------------------------------------------------------------------
  Scenario: After switching to xs, layout order still holds.
    Given I am viewing the site on a xs screen
    Then I see visible heading, subline, list
    And I see heading above list

  Scenario: Switch through multiple breakpoints in one scenario.
    Given I am viewing the site on a xs screen
    Then I see visible heading
    Given I am viewing the site on a md screen
    Then I see visible heading
    Given I am viewing the site on a xl screen
    Then I see visible heading
    And I see heading above list
    Given I am viewing the site on a xxxl screen
    Then I see visible heading

  # ---------------------------------------------------------------------------
  # Advanced — click via xpath-registered selector.
  # ---------------------------------------------------------------------------
  Scenario: Click via an XPath-registered selector.
    When I add "first heading xp" selector for "//h1[1]" xpath selector
    And I click first heading xp

  # ---------------------------------------------------------------------------
  # Advanced — full input-field workflow (focus → select → re-fill).
  # ---------------------------------------------------------------------------
  Scenario: End-to-end field workflow — focus, select all, refill, partial select.
    Given I am on "/test--when--i-fill-in.html"
    And I add "username" selector for "[name='username']" css selector
    And I fill in "username" with "webship-initial"
    When I move focus to "username" field
    Then I see username has focus
    When I select all text in "username" field
    And I fill in "username" with "webship-replacement-value"
    And I select from 0 to 7 text in "username" field
    And I select "replacement" text in "username" field
