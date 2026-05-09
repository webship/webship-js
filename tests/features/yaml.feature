Feature: YAML response assertions

  Scenario: Existence, equality, contains, count
    Given the YAML response content is the following:
      """
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: web
        labels:
          app: web
          team: platform
      spec:
        replicas: 3
        containers:
          - name: nginx
            image: nginx:1.25
          - name: api
            image: myapp:1.0
      """
     Then the response should be in YAML format
      And the YAML should have no duplicate keys
      And the YAML element "/kind" should exist
      And the YAML element "/spec/replicas" should be equal to "3"
      And the YAML element "/metadata/name" should contain "we"
      And the YAML element "/spec/containers" should have 2 elements
      And the YAML attribute "kind" on element "/" should exist
      And the YAML attribute "kind" on element "/" should be equal to "Deployment"

  Scenario: Type and emptiness assertions
    Given the YAML response content is the following:
      """
      replicas: 3
      name: web
      paused: false
      tags: []
      meta: {}
      notes: null
      """
     Then the YAML value at "/replicas" should be of type "integer"
      And the YAML value at "/name" should be of type "string"
      And the YAML value at "/paused" should be of type "boolean"
      And the YAML value at "/tags" should be of type "array"
      And the YAML value at "/meta" should be of type "object"
      And the YAML value at "/notes" should be of type "null"
      And the YAML value at "/tags" should be empty
      And the YAML value at "/meta" should be empty
      And the YAML value at "/name" should not be empty

  Scenario: Numeric comparisons
    Given the YAML response content is the following:
      """
      spec:
        replicas: 5
      timeout: 30
      """
     Then the YAML value at "/spec/replicas" should be greater than 0
      And the YAML value at "/spec/replicas" should be greater than or equal to 5
      And the YAML value at "/spec/replicas" should be less than 10
      And the YAML value at "/spec/replicas" should be less than or equal to 5
      And the YAML value at "/timeout" should be between 5 and 60

  Scenario: Array operations
    Given the YAML response content is the following:
      """
      spec:
        containers:
          - name: nginx
            image: nginx:1.25
          - name: api
            image: myapp:1.0
      """
     Then the YAML array at "/spec/containers" should contain an item where "/name" is "nginx"
      And the YAML array at "/spec/containers" should contain no item where "/image" is "alpine:latest"
      And every item in "/spec/containers" should have key "image"

  Scenario: Key-set assertions
    Given the YAML response content is the following:
      """
      metadata:
        name: web
        namespace: default
        labels:
          app: web
      """
     Then the YAML keys at "/metadata" should be exactly "name, namespace, labels"
      And the YAML at "/metadata" should have keys "name, namespace"

  Scenario: Multi-document streams
    Given the YAML response content is the following:
      """
      apiVersion: v1
      kind: ConfigMap
      ---
      apiVersion: v1
      kind: Service
      """
     Then the YAML response should have 2 documents
      And the YAML element "/kind" should be equal to "ConfigMap"
     Given the active YAML document is 2
     Then the YAML element "/kind" should be equal to "Service"

