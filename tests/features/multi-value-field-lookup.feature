Feature: Fill a multi-value field named by its inputs, its label or its legend
  As a tester,
  I want to fill the inputs of a multi-value field however the form names them,
  so that a scenario can fill a list of values in one step.

  Scenario: A multi-value field named by the legend of its fieldset
    Given I am on "/multi-value-fields.html"
     When I fill in the multi-value field "Phone numbers" with the following values:
        | 0790000000 |
        | 0791111111 |
     Then "#phone-a" should have value "0790000000"
      And "#phone-b" should have value "0791111111"

  Scenario: A multi-value field named by its label
    Given I am on "/multi-value-fields.html"
     When I fill in the multi-value field "Skills" with the following values:
        | testing |
        | design  |
     Then "#skill-1" should have value "testing"
      And "#skill-2" should have value "design"
      And "#skill-3" should have value ""
      And "#website-1" should have value ""

  Scenario: A multi-value field whose inputs are named field[0][value]
    Given I am on "/multi-value-fields.html"
     When I fill in the multi-value field "field_topics" with the following values:
        | news   |
        | events |
     Then "#topics-0" should have value "news"
      And "#topics-1" should have value "events"
