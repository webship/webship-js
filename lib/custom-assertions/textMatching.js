
module.exports.assertion = function (negativeCase, textPattern) {

  browser.elements('css selector', 'body', function (elements) {
    elements.value.forEach(function (elementsObj) {
      if (negativeCase) {
        return browser.assert.not.textMatches(elementsObj, textPattern);
      }
      return browser.assert.textMatches(elementsObj, textPattern);
    });
  });
}
