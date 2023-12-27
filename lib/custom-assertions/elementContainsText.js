
module.exports.assertion = function (negativeCase, expectedText, element) {

  /**
  * Returns the expected value of the assertion which is displayed in the case of a failure
  *
  * @return {string}
  */
  this.expected = function() {
    return this.negate ? `is not '${expectedText}'` : `is '${expectedText}'`;
  };
  
  /**
  * When defined, this method is called by the assertion runner with the command result to determine the actual
  *  state of the assertion in the event of a failure
  *
  * @param {Boolean} passed
  * @return {string}
  */
  this.actual = function(passed) {
    return passed ? `contains '${expectedText}'` : `does not contain '${expectedText}'`;
  };


  browser.element('css selector', element, function (result) {
    if (result.status === 0) {
      if (negativeCase) {
        return browser.assert.not.textContains(element, expectedText).end();
      }
      return browser.assert.textContains(element, expectedText).end();
    } else {
      browser.element('css selector', '#' + element, function (result) {
        if (result.status === 0) {
          if (negativeCase) {
            return browser.assert.not.textContains(element, expectedText).end();
          }
          return browser.assert.textContains(element, expectedText).end();
        } else {
          browser.element('css selector', 'input[name="' + element + '"]', function (result) {
            if (result.status === 0) {
              if (negativeCase) {
                return browser.assert.not.textContains(element, expectedText).end();
              }
              return browser.assert.textContains(element, expectedText).end();
            } else {
              browser.element('css selector', 'input[value="' + element + '"]', function (result) {
                if (result.status === 0) {
                  if (negativeCase) {
                    return browser.assert.not.textContains(element, expectedText).end();
                  }
                  return browser.assert.textContains(element, expectedText).end();
                } else {
                  browser.elements('css selector', 'label', function (elements) {
                    elements.value.forEach(function (elementsObj) {
                      browser.elementIdText(elementsObj.ELEMENT, function (result) {
                        if (result.value == element) {
                          browser.getAttribute(elementsObj, "for", function (forVal) {
                            if (negativeCase) {
                              return browser.assert.not.textContains('#' + forVal.value, expectedText).end();
                            }
                            return browser.assert.textContains('#' + forVal.value, expectedText).end();
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
