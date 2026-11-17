Feature: Selector files named from the project root or by their name
  As a tester,
  I want to name a selector file the way I see it in the project,
  so that the same name works in worldParameters.selectors.files and in a step.

  Scenario: A selector file named from the project root
    Given I am on homepage
     When I add selectors from "tests/selectors/homepage-selectors.json" file
     Then I see visible homepage heading

  Scenario: A selector file named by its name in the selectors folder
    Given I am on homepage
     When I add selectors from "homepage-selectors.json" file
     Then I see visible homepage heading
