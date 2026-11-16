Feature: File download steps
  As a tester,
  I want to download a file from a link or a URL and read what came down,
  so that I can check its name and its content.

  Scenario: Download a file from a link and read it
    Given I am on "/downloads.html"
    When I download the file from the link "Download report"
    Then the downloaded file name should be "webship-report.csv"
    And the downloaded file name should contain "report"
    And the downloaded file name should contain ".csv"
    And the downloaded file should contain:
      """
      name,role,status
      """
    And the downloaded file should contain:
      """
      Webship Admin,administrator,active
      Webship Guest,visitor,blocked
      """

  Scenario: The link decides the name of the downloaded file
    Given I am on "/downloads.html"
    When we download the file from the link "Download release notes"
    Then the downloaded file name should be "release-notes-2026.txt"
    And the downloaded file name should contain "2026"
    And the downloaded file should contain:
      """
      Webship-js release notes
      """

  Scenario: A file downloaded from a URL is read the same way
    When I download the file from the URL "/downloads/webship-report.csv"
    Then the downloaded file name should contain "webship-report"
    And the downloaded file should contain:
      """
      Webship Tester,editor,active
      """
