
module.exports.command = function (elementValue) {

  browser.element('css selector', elementValue, function (result) {
    if (result.status === 0) {
      return browser.click(elementValue);
    } else {
      browser.element('css selector', '#' + elementValue, function (result) {
        if (result.status === 0) {
          return browser.click('#' + elementValue);
        } else {
          browser.element('css selector', '.' + elementValue, function (result) {
            if (result.status === 0) {
              return browser.click('.' + elementValue);
            } else {
              browser.element('css selector', 'input[name="' + elementValue + '"]', function (result) {
                if (result.status === 0) {
                  return browser.click('input[name="' + elementValue + '"]');
                } else {
                  browser.element('css selector', 'input[value="' + elementValue + '"]', function (result) {
                    if (result.status === 0) {
                      return browser.click('input[value="' + elementValue + '"]');
                    } else {
                      browser.elements('css selector', 'label', function (elements) {
                        elements.value.forEach(function (elementsObj) {
                          browser.elementIdText(elementsObj.ELEMENT, function (result) {
                            if (result.value == elementValue) {
                              browser.getAttribute(elementsObj, "for", function (forVal) {
                                return browser.click('#' + forVal.value);
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
  });
}
