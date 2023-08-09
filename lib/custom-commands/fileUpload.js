module.exports.command = function (fileUrl, element) {
  browser.element('css selector', element, function (result) {
    if (result.status === 0) {
      browser.setValue(element, require('path').resolve(__dirname + fileUrl));
    } else {
      browser.element('css selector', '#' + element, function (result) {
        if (result.status === 0) {
          browser.setValue('#' + element, require('path').resolve(__dirname + fileUrl))
        } else {
          browser.element('css selector', '.' + element, function (result) {
            if (result.status === 0) {
              browser.setValue('.' + element, require('path').resolve(__dirname + fileUrl))
            } else {
              browser.element('css selector', 'input[name="' + element + '"]', function (result) {
                if (result.status === 0) {
                  browser.setValue('input[name="' + element + '"]', require('path').resolve(__dirname + fileUrl))
                } else {
                  browser.elements('css selector', 'label', function (elements) {
                    elements.value.forEach(function (elementsObj) {
                      browser.elementIdText(elementsObj.ELEMENT, function (result) {
                        if (result.value == element) {
                          browser.getAttribute(elementsObj, "for", function (forVal) {
                            browser.setValue(forVal.value, require('path').resolve(__dirname + fileUrl))
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
