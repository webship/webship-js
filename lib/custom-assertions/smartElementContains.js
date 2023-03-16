
module.exports.assertion = function (negativeCase, expectedText, element) {

  browser.element('css selector', element, function (result) {
    if (result.status === 0) {
      if (negativeCase) {
        return browser.assert.not.textContains(element, expectedText);
      }
      return browser.assert.textContains(element, expectedText);
    } else {
      browser.element('css selector', '#' + element, function (result) {
        if (result.status === 0) {
          if (negativeCase) {
            return browser.assert.not.textContains(element, expectedText);
          }
          return browser.assert.textContains(element, expectedText);
        } else {
          browser.element('css selector', 'input[name="' + element + '"]', function (result) {
            if (result.status === 0) {
              if (negativeCase) {
                return browser.assert.not.textContains(element, expectedText);
              }
              return browser.assert.textContains(element, expectedText);
            } else {
              browser.element('css selector', 'input[value="' + element + '"]', function (result) {
                if (result.status === 0) {
                  if (negativeCase) {
                    return browser.assert.not.textContains(element, expectedText);
                  }
                  return browser.assert.textContains(element, expectedText);
                } else {
                  browser.elements('css selector', 'label', function (elements) {
                    elements.value.forEach(function (elementsObj) {
                      browser.elementIdText(elementsObj.ELEMENT, function (result) {
                        if (result.value == element) {
                          browser.getAttribute(elementsObj, "for", function (forVal) {
                            if (negativeCase) {
                              return browser.assert.not.textContains('#' + forVal.value, expectedText);
                            }
                            return browser.assert.textContains('#' + forVal.value, expectedText);
                          });
                        }
                      })
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
