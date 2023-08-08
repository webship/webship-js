
module.exports.command = function (option, dropdownlist) {

  browser.element('css selector', dropdownlist, function (result) {
    if (result.status === 0) {
      return browser.click(dropdownlist + ' option[value=' + option + ']');
    } else {
      browser.element('css selector', '#' + dropdownlist, function (result) {
        if (result.status === 0) {
          return browser.click('#' + dropdownlist + ' option[value=' + option + ']');
        } else {
          browser.element('css selector', 'select[name=' + dropdownlist + ']', function (result) {
            if (result.status === 0) {
              return browser.click('select[name=' + dropdownlist + ']' + ' option[value=' + option + ']');
            } else {
              browser.elements('css selector', 'label', function (elements) {
                elements.value.forEach(function (elementsObj) {
                  browser.elementIdText(elementsObj.ELEMENT, function (result) {
                    if (result.value == dropdownlist) {
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
