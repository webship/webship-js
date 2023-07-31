
module.exports.assertion = function (negativeCase, textPattern, element) {

  browser.elements('css selector', element, function (elements) {
    elements.value.forEach(function (elementsObj) {
      if (negativeCase) {
        return browser.assert.not.textMatches(elementsObj, textPattern);
      }
      return browser.assert.textMatches(elementsObj, textPattern);
    });
  });
}
