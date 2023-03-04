
module.exports.command = function (option, selectBox) {

  browser.element('css selector', selectBox, function (result) {
    if (result.status === 0) {
      return browser.click(selectBox + ' option[value=' + option + ']');
    } else {
      browser.element('css selector', '#' + selectBox, function (result) {
        if (result.status === 0) {
          return browser.click('#' + selectBox + ' option[value=' + option + ']');
        } else {
          browser.element('css selector', 'select[name=' + selectBox + ']', function (result) {
            if (result.status === 0) {
              return browser.click('select[name=' + selectBox + ']' + ' option[value=' + option + ']');
            } else {
              browser.elements('css selector', 'label', function (elements) {
                elements.value.forEach(function (elementsObj) {
                  browser.elementIdText(elementsObj.ELEMENT, function (result) {
                    if (result.value == selectBox) {
                      browser.getAttribute(elementsObj, "for", function (forVal) {
                        return browser.click('#' + forVal.value + ' option[value=' + option + ']');
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
