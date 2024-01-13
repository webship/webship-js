
module.exports.assertion = function (element, negativeCase, elementCss) {

  elementCss = elementCss.replace(";", '');
  const cssPropertyArr = elementCss.split(":");

  const cssProperty = cssPropertyArr[0].trim();
  const propertyVal = cssPropertyArr[1].trim();

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
        return browser.assert.not.cssProperty(element, cssProperty, propertyVal).end();
      }
      return browser.assert.cssProperty(element, cssProperty, propertyVal).end();
    } else {
      browser.element('css selector', '#' + element, function (result) {
        if (result.status === 0) {
          if (negativeCase) {
            return browser.assert.not.cssProperty(element, cssProperty, propertyVal).end();
          }
          return browser.assert.cssProperty(element, cssProperty, propertyVal).end();
        } else {
          browser.element('css selector', 'input[name="' + element + '"]', function (result) {
            if (result.status === 0) {
              if (negativeCase) {
                return browser.assert.not.cssProperty(element, cssProperty, propertyVal).end();
              }
              return browser.assert.cssProperty(element, cssProperty, propertyVal).end();
            } else {
              browser.element('css selector', 'input[value="' + element + '"]', function (result) {
                if (result.status === 0) {
                  if (negativeCase) {
                    return browser.assert.not.cssProperty(element, cssProperty, propertyVal).end();
                  }
                  return browser.assert.cssProperty(element, cssProperty, propertyVal).end();
                } else {
                  browser.elements('css selector', 'label', function (elements) {
                    elements.value.forEach(function (elementsObj) {
                      browser.elementIdText(elementsObj.ELEMENT, function (result) {
                        if (result.value == element) {
                          browser.getAttribute(elementsObj, "for", function (forVal) {

                            console.log('#' + forVal.value, cssProperty, propertyVal);
                            if (negativeCase) {
                              return browser.assert.not.cssProperty('#' + forVal.value, cssProperty, propertyVal).end();
                            }
                            return browser.assert.cssProperty('#' + forVal.value, cssProperty, propertyVal).end();
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
