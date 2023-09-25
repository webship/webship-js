
module.exports.assertion = function (checkbox, negativeCase) {

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
