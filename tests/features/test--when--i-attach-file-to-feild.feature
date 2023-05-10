Feature: Example test for "When I attach file to field"

  As a tester
  I want to be able to attach file (images) to feild

  Scenario: Check the "When I attach file to feild" step definitions
    Given I am on "test--when--i-attach-file-to-feild.html"
    When I attach the file "../../upload/webshipco.png" to "#fileUpload"
    When I press "Submit"
    Then I should see "webshipco.png"
