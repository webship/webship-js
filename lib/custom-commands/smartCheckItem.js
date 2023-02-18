
module.exports.command = function (item) {

  browser.element('css selector', '#' + item, function (result) {
    if (result.status === 0) {
      return browser.setAttribute('#' + item, 'checked', true);
    } else {
      browser.element('css selector', 'input[name="' + item + '"]', function (result) {
        if (result.status === 0) {
          return browser.setAttribute('input[name="' + item + '"]', 'checked', true);
        } else {
          browser.element('css selector', 'input[value="' + item + '"]', function (result) {
            if (result.status === 0) {
              return browser.setAttribute('input[value="' + item + '"]', 'checked', true);
            } else {
              browser.elements('css selector', 'label', function (elements) {
                elements.value.forEach(function (elementsObj) {
                  browser.elementIdText(elementsObj.ELEMENT, function (result) {
                    if (result.value == item) {
                      browser.getAttribute(elementsObj, "for", function (forVal) {
                        return browser.setAttribute('#' + forVal.value, 'checked', true);
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
