
module.exports.command = function (item) {

  browser.element('css selector', item, function (result) {
    if (result.status === 0) {
      browser.setAttribute(item, 'checked', false);
      return browser.click(item);
    } else {
      browser.element('css selector', '#' + item, function (result) {
        if (result.status === 0) {
          browser.setAttribute('#' + item, 'checked', false);
          return browser.click('#' + item);
        } else {
          browser.element('css selector', 'input[name=' + item + ']', function (result) {
            if (result.status === 0) {
              browser.setAttribute('input[name=' + item + ']', 'checked', false);
              return browser.click('input[name=' + item + ']');

            } else {
              browser.element('css selector', 'input[value="' + item + '"]', function (result) {
                if (result.status === 0) {
                  browser.setAttribute('input[value="' + item + '"]', 'checked', false);
                  return browser.click('input[value="' + item + '"]');
                } else {
                  browser.elements('css selector', 'label', function (elements) {
                    elements.value.forEach(function (elementsObj) {
                      browser.elementIdText(elementsObj.ELEMENT, function (result) {
                        if (result.value == item) {
                          browser.getAttribute(elementsObj, "for", function (forVal) {
                            browser.setAttribute('#' + forVal.value, 'checked', false);
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
