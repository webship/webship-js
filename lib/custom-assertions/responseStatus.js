const request = require("request");

module.exports.assertion = function (negativeCase, expectedStatusCode) {
  
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

  return browser.url(function (currentURL) {
    request(currentURL.value, (error, response, body) => {
      if (negativeCase) {
        return browser.assert.not.equal(response.statusCode, expectedStatusCode).end();
      }
      return browser.assert.equal(response.statusCode, expectedStatusCode).end();
    });
  });
}
