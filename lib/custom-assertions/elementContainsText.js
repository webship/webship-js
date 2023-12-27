
module.exports.assertion = function (negativeCase, expectedText, element) {

  /**
  * Returns the expected value of the assertion which is displayed in the case of a failure
  *
  * @return {string}
  */
  browser.expected = function() {
    return browser.negate ? `is not '${expectedText}'` : `is '${expectedText}'`;
  };
  
  /**
    * Given the value, the condition used to evaluate if the assertion is passed
    * @param {*} value
    * @return {Boolean}
    */
  browser.evaluate = function(value) {
    if (typeof value != 'string') {
      return false;
    }
    
    return value.includes(expectedText);
  };
 
  /**
  * When defined, browser method is called by the assertion runner with the command result to determine the actual
  *  state of the assertion in the event of a failure
  *
  * @param {Boolean} passed
  * @return {string}
  */
  browser.actual = function(passed) {
    return passed ? `contains '${expectedText}'` : `does not contain '${expectedText}'`;
  };

  /**
   * The command which is to be executed by the assertion runner; Nightwatch api is available as browser.api
   * @param {function} callback
   */
  browser.command = function(callback) {
    // Example: browser.api.getText(definition, callback);
    
    setTimeout(function() {
      // The object containing a "value" property will be passed to the .value() method to determine the value w
      // which is to be evaluated (by the .evaluate() method)
      callback({
        value: ''
      });
      
    }, 1000);   
    
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
