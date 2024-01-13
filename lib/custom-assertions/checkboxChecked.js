
module.exports.assertion = function (checkbox, negativeCase) {

  browser.message = `Testing if text of <${element}> ` + (negativeCase ? `does not contain '${expectedText}'` : `contains '${expectedText}'`);

  browser.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  browser.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  browser.value = function (result) {
    return result.value;
  };

  browser.command = function (callback) {
    return browser.api.getText(element, callback);
  };

  browser.pass = function (value) {
    return browser.evaluate(value);
  };

  browser.failure = function (result) {
    return result === false || result && result.status === -1;
  };

  browser.element('css selector', checkbox, function (result) {
    if (result.status === 0) {
      if (negativeCase) {
        return browser.expect.element(checkbox).to.not.be.selected.end();
      }
      return browser.expect.element(checkbox).to.be.selected.end();
    } else {
      browser.element('css selector', '#' + checkbox, function (result) {
        if (result.status === 0) {
          if (negativeCase) {
            return browser.expect.element('#' + checkbox).to.not.be.selected.end();
          }
          return browser.expect.element('#' + checkbox).to.be.selected.end();
        } else {
          browser.element('css selector', 'input[name="' + checkbox + '"]', function (result) {
            if (result.status === 0) {
              if (negativeCase) {
                return browser.expect.element('input[name="' + checkbox + '"]').to.not.be.selected.end();
              }
              return browser.expect.element('input[name="' + checkbox + '"]').to.be.selected.end();
            } else {
              browser.element('css selector', 'input[value="' + checkbox + '"]', function (result) {
                if (result.status === 0) {
                  if (negativeCase) {
                    return browser.expect.element('input[value="' + checkbox + '"]').to.not.be.selected.end();
                  }
                  return browser.expect.element('input[value="' + checkbox + '"]').to.be.selected.end();
                } else {
                  browser.elements('css selector', 'label', function (elements) {
                    elements.value.forEach(function (elementsObj) {
                      browser.elementIdText(elementsObj.ELEMENT, function (result) {
                        if (result.value == checkbox) {
                          browser.getAttribute(elementsObj, "for", function (forVal) {
                            if (negativeCase) {
                              return browser.expect.element('#' + forVal.value).to.not.be.selected.end();
                            }
                            return browser.expect.element('#' + forVal.value).to.be.selected.end();
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
