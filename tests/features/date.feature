Feature: Relative date token resolution

  Tokens of the form [relative:OFFSET] and [relative:OFFSET#FORMAT]
  are resolved before the step runs. OFFSET supports "+N unit", "-N unit",
  "now", and "next/last <weekday>". Without FORMAT the value is a Unix
  timestamp; with FORMAT it is rendered using YYYY/MM/DD/HH/mm/ss tokens.

  Scenario: Resolve relative date tokens in step text
    Given I am on "/date.html"
     Then I should see "[relative:now#YYYY]"
      And I should see "[relative:now#MM]"
