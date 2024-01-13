
module.exports.assertion = function (negativeCase, textPattern, element) {

  this.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  this.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  this.value = function (result) {
    return result.value;
  };

  /**
   * The command which is to be executed by the assertion runner; Nightwatch api is available as browser.api
   * @param {function} callback
   */
  this.command = function(callback) {
    setTimeout(function() {
      callback({
        value: ''
      });
    }, 1000);   
  };

  this.pass = function (value) {
    return this.evaluate(value);
  };

  this.failure = function (result) {
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
