
module.exports.assertion = function (negativeCase, expectedText, element) {

  this.message = `Testing if text of <${element}> ` + (negativeCase ? `does not contain '${expectedText}'` : `contains '${expectedText}'`);

  this.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  this.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  this.value = function (result) {
    return result.value;
  };

  /**
   * The command which is to be executed by the assertion runner; Nightwatch api is available as browser.api
   * @param {function} callback
   */
  this.command = function(callback) {
    setTimeout(function() {
      callback({
        value: ''
      });
    }, 1000);   
  };

  this.pass = function (value) {
    return this.evaluate(value);
  };

  this.failure = function (result) {
    return result === false || result && result.status === -1;
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
