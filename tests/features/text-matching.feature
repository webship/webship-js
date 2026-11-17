Feature: The page-text steps read the page the same way
  `I should see`, `I should not see` and `eventually I should see` read the
  text of the page with one matcher: letter case ignored, white space
  collapsed, the text of hidden elements included, the text of <script> and
  <style> left out. On the page, "Saving draft" goes away and "Draft saved"
  arrives about two seconds after it opens, on a timer the smart waits do not
  wait for.

  Scenario: Letter case does not matter, in either polarity
    Given I am on "/text-matching.html"
    Then I should see "next page"
    And I should see "NEXT PAGE"
    And I should not see "previous page"

  Scenario: The text of a hidden element is page text
    Given I am on "/text-matching.html"
    Then I should see "Members save 10 percent"
    And I should see "members save 10 percent"

  Scenario: The text of a script or a style is not page text
    Given I am on "/text-matching.html"
    Then I should not see "inlineScriptMarker"
    And I should not see "only a script reads this"
    And I should not see "styleRuleMarker"

  Scenario: White space is collapsed
    Given I am on "/text-matching.html"
    Then I should see "Order total: 42 items"

  Scenario: The negative waits for a text that goes away
    Given I am on "/text-matching.html"
    Then I should not see "Saving draft"

  Scenario: Eventually reads the page text the same way
    Given I am on "/text-matching.html"
    Then eventually I should see "draft saved" within 5 seconds
    And eventually I should see "saved as version 2"
    And eventually we should see "NEXT PAGE"
