Feature: An example of checking the attachment of a file to a field
  As a tester,
  I want to be able to attach a file (e.g., images) to a field

  Scenario: Checking the attachment of an image to a field
    Given I am on "/test--when--i-attach-file-to-feild.html"
     When I attach the file "webshipco.png" to "#fileUpload"
      And I press "Submit" by attr
      And I wait 2 second