const request = require("request");

module.exports.assertion = function (negativeCase, expectedStatusCode) {
  
  this.message = `Testing if text of <${element}> ` + (negativeCase ? `does not contain '${expectedText}'` : `contains '${expectedText}'`);

  this.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  this.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  this.value = function (result) {
    return result.value;
  };

  this.command = function (callback) {
    return this.api.getText(element, callback);
  };

  this.pass = function (value) {
    return this.evaluate(value);
  };

  this.failure = function (result) {
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
