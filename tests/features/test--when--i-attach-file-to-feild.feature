Feature: An example to test attach file to field

  As a tester
  I want to be able to attach file (images) to field

  Scenario: Check attach file to field
    Given I am on "test--when--i-attach-file-to-feild.html"
    When I attach the file "webshipco.png" to "#fileUpload"
    When I press "Submit"
    Then I should see "webshipco.png"
