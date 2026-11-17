Feature: The namespaces of an XML document
  As a tester,
  I want to check the namespaces an XML response uses, wherever it declares them,
  so that a SOAP body or a feed extension is checked as well as the root element.

  Scenario: A namespace declared below the root element
    Given the response content is the following:
      """
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <m:GetPriceResponse xmlns:m="https://www.example.org/stock">
            <m:Price>34.5</m:Price>
          </m:GetPriceResponse>
        </soap:Body>
      </soap:Envelope>
      """
     Then the XML should use the namespace "http://schemas.xmlsoap.org/soap/envelope/"
      And the XML should use the namespace "https://www.example.org/stock"
      And the XML should not use the namespace "http://www.w3.org/2005/Atom"

  Scenario: A default namespace declared on a child element
    Given the response content is the following:
      """
      <page><content xmlns="http://www.w3.org/1999/xhtml"><p>Hello</p></content></page>
      """
     Then the XML should use the namespace "http://www.w3.org/1999/xhtml"

  Scenario: An attribute whose value is a URI is not a namespace
    Given the response content is the following:
      """
      <links home="http://www.w3.org/1999/xhtml"><link href="http://www.w3.org/2005/Atom">Atom</link></links>
      """
     Then the XML should not use the namespace "http://www.w3.org/1999/xhtml"
      And the XML should not use the namespace "http://www.w3.org/2005/Atom"
