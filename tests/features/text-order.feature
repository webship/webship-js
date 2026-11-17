Feature: One text after another, on the page or inside one element
  `the text "A" should appear after the text "B"` compares the first place
  each text appears in the visible text of the whole page; adding
  `in the "<selector>" element` compares them inside that element.

  Scenario: The whole page: the menu holds the first "Products"
    Given I am on "/text-order.html"
    Then the text "Total" should appear after the text "Subtotal"
    And the text "Home" should appear after the text "Products"

  Scenario: Inside the breadcrumb
    Given I am on "/text-order.html"
    Then the text "Products" should appear after the text "Home" in the "nav.breadcrumb" element
    And the text "Laptops" should appear after the text "Products" in the "nav.breadcrumb" element
