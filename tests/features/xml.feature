Feature: XML response assertions
  As a tester,
  I want to load an XML document from a file or from the scenario and check its elements, attributes and namespaces,
  so that feeds, sitemaps and XML answers are covered like pages are.

  Scenario: XML loaded from a file under tests/assets
    Given the response content from the file "catalog.xml"
     Then the response should be in XML format
      And the XML element "/catalog" should exist
      And the XML element "/catalog/book" should have 3 elements
      And the XML element "/catalog/status" should have 1 element
      And the XML element "/catalog/status" should be equal to "published"

  Scenario: Elements exist, are equal and contain, and the opposite of each
    Given the response content from the file "catalog.xml"
     Then the XML element "//book/title" should exist
      And the XML element "/catalog/book[2]/title" should exist
      And the XML element "/catalog/magazine" should not exist
      And the XML element "//error" should not exist
      And the XML element "/catalog/book[1]/title" should be equal to "Testing with Webship-js"
      And the XML element "/catalog/book[3]/title" should not be equal to "Testing with Webship-js"
      And the XML element "/catalog/book[2]/title" should contain "development"
      And the XML element "/catalog/book[2]/title" should not contain "Webship-js"
      And the XML element "/catalog/book[@lang='fr']/price" should be equal to "19.00"

  Scenario: Attributes exist, are equal and contain, and the opposite of each
    Given the response content from the file "catalog.xml"
     Then the XML attribute "id" on element "/catalog/book[1]" should exist
      And the XML attribute "isbn" on element "/catalog/book[1]" should not exist
      And the XML attribute "version" on element "/catalog" should be equal to "2.0"
      And the XML attribute "lang" on element "/catalog/book[3]" should not be equal to "en"
      And the XML attribute "updated" on element "/catalog" should contain "2026"
      And the XML attribute "currency" on element "/catalog/book[2]/price" should not contain "USD"

  Scenario: XML written in the scenario
    Given the response content is the following:
      """
      <order id="A-100">
        <customer><name>Webship Tester</name></customer>
        <status>shipped</status>
      </order>
      """
     Then the response should be in XML format
      And the XML element "/order/customer/name" should be equal to "Webship Tester"
      And the XML element "//status" should contain "ship"
      And the XML attribute "id" on element "/order" should be equal to "A-100"

  Scenario: Namespaces the root element declares
    Given the response content from the file "feed-namespaced.xml"
     Then the XML should use the namespace "http://www.w3.org/2005/Atom"
      And the XML should use the namespace "http://purl.org/dc/elements/1.1/"
      And the XML should not use the namespace "http://www.w3.org/1999/xhtml"
      And the XML element "/feed/entry" should have 2 elements
      And the XML element "/feed/entry[2]/title" should be equal to "Second release"

  Scenario: Elements and attributes with a namespace prefix
    Given the response content from the file "feed-namespaced.xml"
     Then the XML element "//dc:creator" should exist
      And the XML element "/feed/entry/dc:creator" should have 2 elements
      And the XML element "/feed/entry[1]/dc:creator" should be equal to "Webship"
      And the XML attribute "rel" on element "/feed/atom:link" should be equal to "self"
      And the XML attribute "href" on element "/feed/atom:link" should contain "feed.xml"
      And the XML element "//dc:publisher" should not exist

  Scenario: A sitemap: names without a prefix in the default namespace
    Given the response content from the file "sitemap.xml"
     Then the XML should use the namespace "http://www.sitemaps.org/schemas/sitemap/0.9"
      And the XML element "/urlset/url" should have 2 elements
      And the XML element "/urlset/url[1]/loc" should be equal to "https://example.com/"
      And the XML element "/urlset/url[2]/lastmod" should contain "2026-11"
      And the XML element "//image:image/image:loc" should contain "logo.png"
      And the XML element "/urlset/url[2]/image:image" should not exist
      And the XML element "/urlset/url[1]/image" should not exist

  Scenario: Content that is not XML
    Given the response content is the following:
      """
      {"hello": "world"}
      """
     Then the response should not be in XML format
    Given the response content is the following:
      """
      plain text
      """
     Then the response should not be in XML format
    Given the response content is the following:
      """
      <order><status>shipped</order>
      """
     Then the response should not be in XML format
    Given the response content is the following:
      """
      <order><status>shipped</status></order>
      """
     Then the response should be in XML format
      And the XML element "/order/status" should be equal to "shipped"
