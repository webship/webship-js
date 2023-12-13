module.exports.command = function (item) {

  browser.element('css selector', item, function (result) {
    if (result.status === 0) {
      return browser.click(item);
    } else {
      browser.element('css selector', '#' + item, function (result) {
        if (result.status === 0) {
          return browser.click('#' + item);
        } else {
          browser.element('css selector', '.' + item, function (result) {
            if (result.status === 0) {
              return browser.click('.' + item);
            } else {
              browser.element('css selector', 'input[name=' + item + ']', function (result) {
                if (result.status === 0) {
                  return browser.click('input[name=' + item + ']');
                } else {
                  browser.element('css selector', 'input[value="' + item + '"]', function (result) {
                    if (result.status === 0) {
                      return browser.click('input[value="' + item + '"]');
                    } else {
                      browser.elements('css selector', 'label', function (elements) {
                        elements.value.forEach(function (elementsObj) {
                          browser.elementIdText(elementsObj.ELEMENT, function (result) {
                            if (result.value == item) {
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