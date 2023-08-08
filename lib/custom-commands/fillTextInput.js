module.exports.command = function (field, value) {
  let element = null;
  let selector = field;

  browser.element('css selector', selector, function (result) {
    if (result.status == 0) {
      return browser.setValue(selector, value);
    }
    else {
      selector = '#' + field;
      browser.element('css selector', selector, function (result) {
        if (result.status == 0) {
          return browser.setValue(selector, value);
        }
        else {
          selector = '.' + field;
          browser.element('css selector', selector, function (result) {
            if (result.status == 0) {
              return browser.setValue(selector, value);
            }
            else {
              selector = 'input[name=' + field + ']';
              browser.element('css selector', selector, function (result) {
                if (result.status == 0) {
                  return browser.setValue(selector, value);
                }
                else {
                  selector = "input[placeholder='" + field + "']";
                  browser.element('css selector', selector, function (result) {
                    if (result.status == 0) {
                      return browser.setValue(selector, value);
                    }
                    else {
                      browser.elements('css selector', 'label', function (elements) {
                        for (let i = 0; i < elements.value.length; i++) {
                          this.elementIdText(elements.value[i].ELEMENT, function (result) {
                            if (result.value === field) {
                              element = elements.value[i].ELEMENT;
                              browser.elementIdAttribute(element, 'for', function (eleAttribute) {
                                return browser.setValue('#' + eleAttribute.value, value);
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
      });
    }
  });
}