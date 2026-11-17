@must-fail
Feature: YAML numbers that must fail, and what they say
  tests/check-must-fail.js runs these scenarios and checks that each one fails
  at its last step with the message its description announces, the address of
  the page and a hint.

  Scenario: A quoted number is a string, not a number
    Fails with: The YAML value at "/spec/replicas" is the string "3", not a number.
    Given the YAML response content is the following:
      """
      spec:
        replicas: "3"
      """
     Then the YAML value at "/spec/replicas" should be between 1 and 5

  Scenario: A null is not zero
    Fails with: The YAML value at "/timeout" is null, not a number.
    Given the YAML response content is the following:
      """
      timeout: ~
      """
     Then the YAML value at "/timeout" should be greater than or equal to 0

  Scenario: A boolean is not one
    Fails with: The YAML value at "/retries" is the boolean true, not a number.
    Given the YAML response content is the following:
      """
      retries: true
      """
     Then the YAML value at "/retries" should be less than or equal to 3

  Scenario: A number that is not greater
    Fails with: The YAML value at "/spec/replicas" is 3, not greater than 5.
    Given the YAML response content is the following:
      """
      spec:
        replicas: 3
      """
     Then the YAML value at "/spec/replicas" should be greater than 5

  Scenario: A number out of the range
    Fails with: The YAML value at "/spec/replicas" is 7, not between 1 and 5.
    Given the YAML response content is the following:
      """
      spec:
        replicas: 7
      """
     Then the YAML value at "/spec/replicas" should be between 1 and 5
