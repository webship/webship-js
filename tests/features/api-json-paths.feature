Feature: The API JSON property steps take a dot path or a JSON Pointer
  As a tester,
  I want to name a property of the response the way the YAML steps do too
  So that a path written either way reads the same property

  Background:
    Given the API base URL is "/"
    When I send a GET request to "/example-api.json"

  Scenario: A dot path, with an index written either way
    Then the JSON response should have "data.0.type" equal to "articles"
     And the JSON response should have "data[0].attributes.title" equal to "JSON:API paints my bikeshed!"
     And the JSON property "included.0.attributes.age" should be 80

  Scenario: A JSON Pointer
    Then the JSON response should have "/data/0/type" equal to "articles"
     And the API response should have "/included/0/attributes/name" equal to "John"
     And the JSON property "/included/0/attributes/age" should be 80
     And the JSON response should have property "/data/0/relationships/author"
     And the JSON response should not have property "/data/0/password"

  Scenario: A JSON Pointer to a property that is there is not taken for a missing key
    Then the API response should contain property "/data/0/type"
     And the JSON response should not have property "/data/0/discount"
