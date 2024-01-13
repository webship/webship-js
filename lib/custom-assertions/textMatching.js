
module.exports.assertion = function (negativeCase, textPattern, element) {

  browser.message = `Testing if text of <${element}> ` + (negativeCase ? `does not contain '${expectedText}'` : `contains '${expectedText}'`);

  browser.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  browser.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  browser.value = function (result) {
    return result.value;
  };

  browser.command = function (callback) {
    return browser.api.getText(element, callback);
  };

  browser.pass = function (value) {
    return browser.evaluate(value);
  };

  browser.failure = function (result) {
    return result === false || result && result.status === -1;
  };

  browser.elements('css selector', element, function (elements) {
    elements.value.forEach(function (elementsObj) {
      if (negativeCase) {
        return browser.assert.not.textMatches(elementsObj, textPattern).end();
      }
      return browser.assert.textMatches(elementsObj, textPattern).end();
    });
  });
}
