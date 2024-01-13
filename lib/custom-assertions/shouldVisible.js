
module.exports.assertion = function (negativeCase, element) {

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

  if (negativeCase) {
    return browser.verify.not.visible(element).end();
  }
  return browser.verify.visible(element).end();
}
